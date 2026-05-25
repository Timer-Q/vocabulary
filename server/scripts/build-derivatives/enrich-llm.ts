import { config } from 'dotenv';
import { IsArray, IsIn, IsOptional, IsString, MinLength, validateSync } from 'class-validator';
import { ExampleLevel } from '@prisma/client';
import {
  buildExampleSentence,
  buildMorphemeStory,
  buildSplitPattern,
} from '../../src/modules/roots/morpheme-detail-expander';
import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import { posFromEcdict } from './select-derivatives';
import { normalizeMorphemeForm } from './normalize';
import {
  DERIVATIVES_CACHE_DIR,
  cacheFileName,
  ensureDir,
  readJsonFile,
  sleep,
  writeJsonFile,
} from './paths';
import type {
  EnrichedDerivative,
  LlmSplitSegment,
  LlmWordEnrichment,
  MorphemeDerivativeCache,
  MorphemeSelectionCache,
} from './types';
import type { RootListItem } from './types';

config({ path: '.env.local' });
config({ path: '.env' });

const LLM_DELAY_MS = 350;

class SplitSegmentDto {
  @IsString()
  @MinLength(1)
  form!: string;

  @IsIn(['prefix', 'root', 'suffix'])
  type!: 'prefix' | 'root' | 'suffix';

  @IsString()
  @MinLength(1)
  meaning!: string;

  @IsOptional()
  @IsString()
  rootForm!: string | null;
}

class WordEnrichmentDto {
  @IsArray()
  splitPattern!: SplitSegmentDto[];

  @IsString()
  @MinLength(8)
  exampleEn!: string;

  @IsString()
  @MinLength(4)
  exampleZh!: string;

  @IsIn(['basic', 'exam', 'advanced', 'classic', 'root_transfer'])
  exampleLevel!: ExampleLevel;
}

class StoryDto {
  @IsString()
  @MinLength(20)
  story!: string;
}

function findCatalogItem(kind: string, form: string): RootListItem | undefined {
  const norm = normalizeMorphemeForm(form);
  return MORPHEME_CATALOG.find((m) => m.kind === kind && normalizeMorphemeForm(m.form) === norm);
}

function parseJsonFromLlm(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

function validateWordEnrichment(data: unknown): LlmWordEnrichment | null {
  const dto = Object.assign(new WordEnrichmentDto(), data);
  const errors = validateSync(dto, { whitelist: true });
  if (errors.length > 0) {
    return null;
  }
  return {
    splitPattern: dto.splitPattern.map((s) => ({
      form: s.form,
      type: s.type,
      meaning: s.meaning,
      rootForm: s.rootForm ?? null,
    })),
    exampleEn: dto.exampleEn,
    exampleZh: dto.exampleZh,
    exampleLevel: dto.exampleLevel,
  };
}

function validateStory(data: unknown): string | null {
  const dto = Object.assign(new StoryDto(), data);
  const errors = validateSync(dto, { whitelist: true });
  return errors.length > 0 ? null : dto.story;
}

async function callLlm(system: string, user: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('LLM_API_KEY is required for enrich-llm');
  }

  const provider = process.env.LLM_PROVIDER?.trim() || 'deepseek';
  const baseUrl =
    provider === 'deepseek'
      ? 'https://api.deepseek.com/chat/completions'
      : process.env.LLM_BASE_URL?.trim() || 'https://api.deepseek.com/chat/completions';
  const model = process.env.LLM_MODEL?.trim() || 'deepseek-chat';

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM empty response');
  }
  return content;
}

function fallbackWordEnrichment(
  item: RootListItem,
  spelling: string,
): LlmWordEnrichment {
  const { en, zh } = buildExampleSentence(item, spelling);
  return {
    splitPattern: buildSplitPattern(item, spelling).map((s: LlmSplitSegment) => ({
      form: s.form,
      type: s.type,
      meaning: s.meaning,
      rootForm: s.rootForm,
    })),
    exampleEn: en,
    exampleZh: zh,
    exampleLevel: 'basic',
  };
}

async function enrichWord(
  item: RootListItem,
  spelling: string,
  useLlm: boolean,
): Promise<LlmWordEnrichment> {
  if (!useLlm) {
    return fallbackWordEnrichment(item, spelling);
  }

  const system =
    'You are an English etymology tutor for Chinese CET learners. Reply with JSON only, no markdown.';
  const user = JSON.stringify({
    task: 'word_enrichment',
    morpheme: { kind: item.kind, form: item.form, meaning: item.meaning },
    word: spelling,
    required: {
      splitPattern: [{ form: 'string', type: 'prefix|root|suffix', meaning: '中文', rootForm: 'string|null' }],
      exampleEn: 'natural English sentence using the word',
      exampleZh: 'Chinese translation',
      exampleLevel: 'basic|exam|advanced',
    },
  });

  try {
    const raw = await callLlm(system, user);
    const parsed = parseJsonFromLlm(raw);
    const validated = validateWordEnrichment(parsed);
    if (validated) {
      return validated;
    }
  } catch (err) {
    console.warn(`[llm] word ${spelling}:`, err instanceof Error ? err.message : err);
  }

  return fallbackWordEnrichment(item, spelling);
}

async function enrichStory(item: RootListItem, derivatives: string[], useLlm: boolean): Promise<string> {
  if (!useLlm) {
    return buildMorphemeStory(item, derivatives);
  }

  const system =
    'You are an English etymology tutor. Reply with JSON: {"story":"..."} in Simplified Chinese, 2-3 sentences.';
  const user = JSON.stringify({
    morpheme: { kind: item.kind, form: item.form, meaning: item.meaning, origin: item.originLabel },
    sampleWords: derivatives.slice(0, 5),
  });

  try {
    const raw = await callLlm(system, user);
    const parsed = parseJsonFromLlm(raw);
    const story = validateStory(parsed);
    if (story) {
      return story;
    }
  } catch (err) {
    console.warn(`[llm] story ${item.form}:`, err instanceof Error ? err.message : err);
  }

  return buildMorphemeStory(item, derivatives);
}

function levelTagsFromEcdict(tags: string[]): string[] {
  const levels: string[] = [];
  if (tags.includes('cet4')) {
    levels.push('cet4');
  }
  if (tags.includes('cet6')) {
    levels.push('cet6');
  }
  if (tags.includes('ky')) {
    levels.push('kaoyan');
  }
  if (tags.includes('ielts')) {
    levels.push('ielts');
  }
  if (tags.includes('toefl')) {
    levels.push('toefl');
  }
  if (levels.length === 0) {
    levels.push('cet4');
  }
  return levels;
}

export async function enrichMorphemeSelection(
  selection: MorphemeSelectionCache,
  options: { useLlm: boolean; force: boolean },
): Promise<MorphemeDerivativeCache> {
  const cachePath = `${DERIVATIVES_CACHE_DIR}/${cacheFileName(selection.kind, selection.form)}`;
  if (!options.force) {
    const cached = readJsonFile<MorphemeDerivativeCache>(cachePath);
    if (cached) {
      return cached;
    }
  }

  const item = findCatalogItem(selection.kind, selection.form);
  if (!item) {
    throw new Error(`Catalog item not found: ${selection.kind}:${selection.form}`);
  }

  const derivativeSpellings = selection.derivatives.map((d) => d.spelling);
  const story = await enrichStory(item, derivativeSpellings, options.useLlm);
  if (options.useLlm) {
    await sleep(LLM_DELAY_MS);
  }

  const words: EnrichedDerivative[] = [];
  let freq = 300;

  for (const selected of selection.derivatives) {
    const enrichment = await enrichWord(item, selected.spelling, options.useLlm);
    if (options.useLlm) {
      await sleep(LLM_DELAY_MS);
    }

    freq += 1;
    const pos = posFromEcdict(selected.ecdict);
    words.push({
      spelling: selected.spelling,
      phoneticUk: selected.ecdict.phonetic,
      phoneticUs: selected.ecdict.phonetic,
      frequency: freq,
      level: levelTagsFromEcdict(selected.ecdict.tags),
      pos,
      splitPattern: enrichment.splitPattern.map((s: LlmSplitSegment) => ({
        form: s.form,
        type: s.type,
        meaning: s.meaning,
        rootForm: s.rootForm,
      })),
      exampleEn: enrichment.exampleEn,
      exampleZh: enrichment.exampleZh,
      exampleLevel: enrichment.exampleLevel,
      score: selected.score,
    });
  }

  const cache: MorphemeDerivativeCache = {
    kind: selection.kind,
    form: selection.form,
    normalizedForm: selection.normalizedForm,
    meaning: selection.meaning,
    story,
    words,
    enrichedAt: new Date().toISOString(),
  };

  ensureDir(DERIVATIVES_CACHE_DIR);
  writeJsonFile(cachePath, cache);
  return cache;
}

export async function enrichAllSelections(
  selections: MorphemeSelectionCache[],
  options: { useLlm: boolean; force: boolean },
): Promise<MorphemeDerivativeCache[]> {
  const useLlm = options.useLlm && Boolean(process.env.LLM_API_KEY?.trim());
  if (options.useLlm && !useLlm) {
    console.warn('[llm] 未配置 LLM_API_KEY，使用模板回退');
  }

  const results: MorphemeDerivativeCache[] = [];
  for (let i = 0; i < selections.length; i += 1) {
    const selection = selections[i];
    const cache = await enrichMorphemeSelection(selection, { useLlm, force: options.force });
    results.push(cache);
    if ((i + 1) % 10 === 0 || i === selections.length - 1) {
      console.log(`[llm] ${i + 1}/${selections.length} ${selection.form} (${cache.words.length} 词)`);
    }
  }
  return results;
}
