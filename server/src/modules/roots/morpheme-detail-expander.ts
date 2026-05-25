import type { MorphemeKind, RootListItem } from './roots.types';
import type { RootOrigin } from '@prisma/client';

const ENGLISH_WORD_PATTERN = /[A-Za-z][A-Za-z-]*/g;
const DERIVATIVE_LIMIT = 5;
const EXAMPLE_LIMIT_PER_MORPHEME = 2;

export interface ExpandedMorphemeDetail {
  kind: MorphemeKind;
  form: string;
  normalizedForm: string;
  story: string;
  derivatives: string[];
}

export interface ExpandedSeedWord {
  spelling: string;
  frequency: number;
  level: string[];
  pos: { pos: string; meaning: string }[];
  splitPattern: {
    form: string;
    type: 'prefix' | 'root' | 'suffix';
    meaning: string;
    rootForm: string | null;
  }[];
}

export interface ExpandedSeedExample {
  spelling: string;
  targetRootForm?: string;
  sentence: string;
  translation: string;
}

export interface ExpandedSeedRoot {
  form: string;
  origin: RootOrigin;
  meaning: string;
  extendedMeaning: string;
  story: string;
}

export function normalizeMorphemeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

export function extractDerivativeWords(extendedMeaning: string | null): string[] {
  const matches = extendedMeaning?.match(ENGLISH_WORD_PATTERN) ?? [];
  const seen = new Set<string>();
  return matches
    .map((w) => w.replace(/^-+|-+$/g, '').toLowerCase())
    .filter((w) => {
      if (w.length < 3 || seen.has(w)) {
        return false;
      }
      seen.add(w);
      return true;
    })
    .slice(0, DERIVATIVE_LIMIT);
}

const KIND_LABEL: Record<MorphemeKind, string> = {
  root: '词根',
  prefix: '前缀',
  suffix: '后缀',
  combining_form: '连结词素',
};

export function buildMorphemeStory(item: RootListItem, derivatives: string[]): string {
  const sample = derivatives.slice(0, 3).join('、') || '常见派生词';
  const kindLabel = KIND_LABEL[item.kind];
  const layer =
    item.level === 'advanced'
      ? '进阶层词素在学术与专业阅读中更常出现，'
      : '核心层词素在四六级与日常阅读中高频出现，';

  if (item.kind === 'root') {
    return `${item.form} 源自${item.originLabel}，本义「${item.meaning}」。${layer}拆词时先锁定这一节，再联系 ${sample} 等词族，能更快建立语义网络。`;
  }
  if (item.kind === 'prefix') {
    return `${item.form} 是${kindLabel}，多表示「${item.meaning}」。${layer}贴在词头会改写整词方向，可先从 ${sample} 等组合记牢。`;
  }
  if (item.kind === 'suffix') {
    return `${item.form} 是${kindLabel}，常表达「${item.meaning}」。${layer}它决定词性与抽象走向，留意 ${sample} 等尾缀搭配。`;
  }
  return `${item.form} 是${kindLabel}，含义为「${item.meaning}」。${layer}多见于科技术语组合，如 ${sample}，可与相邻词素并列记忆。`;
}

function guessPos(spelling: string): { pos: string; meaning: string } {
  if (spelling.endsWith('tion') || spelling.endsWith('sion') || spelling.endsWith('ment')) {
    return { pos: 'n', meaning: '名词' };
  }
  if (spelling.endsWith('ive') || spelling.endsWith('ous') || spelling.endsWith('ful')) {
    return { pos: 'adj', meaning: '形容词' };
  }
  if (spelling.endsWith('ize') || spelling.endsWith('ify') || spelling.endsWith('ate')) {
    return { pos: 'v', meaning: '动词' };
  }
  if (spelling.endsWith('ly')) {
    return { pos: 'adv', meaning: '副词' };
  }
  return { pos: 'n', meaning: '词汇' };
}

export function buildSplitPattern(
  item: RootListItem,
  spelling: string,
): ExpandedSeedWord['splitPattern'] {
  const norm = normalizeMorphemeForm(item.form);
  const lower = spelling.toLowerCase();
  const segments: ExpandedSeedWord['splitPattern'] = [];

  if (item.kind === 'root' && lower.includes(norm)) {
    const idx = lower.indexOf(norm);
    if (idx > 0) {
      segments.push({
        form: spelling.slice(0, idx),
        type: 'prefix',
        meaning: '前缀',
        rootForm: null,
      });
    }
    segments.push({
      form: spelling.slice(idx, idx + norm.length),
      type: 'root',
      meaning: item.meaning,
      rootForm: norm,
    });
    const tail = spelling.slice(idx + norm.length);
    if (tail) {
      segments.push({
        form: tail.startsWith('-') ? tail : `-${tail}`,
        type: 'suffix',
        meaning: '后缀',
        rootForm: null,
      });
    }
    return segments.length > 0 ? segments : [{ form: norm, type: 'root', meaning: item.meaning, rootForm: norm }];
  }

  if (item.kind === 'prefix') {
    const prefix = item.form.endsWith('-') ? item.form : `${item.form}-`;
    const bare = norm;
    if (lower.startsWith(bare)) {
      segments.push({
        form: prefix,
        type: 'prefix',
        meaning: item.meaning,
        rootForm: null,
      });
      const rest = spelling.slice(bare.length);
      if (rest) {
        segments.push({
          form: rest,
          type: 'root',
          meaning: '词干',
          rootForm: null,
        });
      }
      return segments;
    }
  }

  if (item.kind === 'suffix') {
    const suffix = item.form.startsWith('-') ? item.form : `-${item.form}`;
    const bare = norm;
    if (lower.endsWith(bare)) {
      const stem = spelling.slice(0, spelling.length - bare.length);
      if (stem) {
        segments.push({
          form: stem,
          type: 'root',
          meaning: '词干',
          rootForm: null,
        });
      }
      segments.push({
        form: suffix,
        type: 'suffix',
        meaning: item.meaning,
        rootForm: null,
      });
      return segments;
    }
  }

  if (item.kind === 'combining_form') {
    if (lower.startsWith(norm)) {
      segments.push({
        form: spelling.slice(0, norm.length),
        type: 'root',
        meaning: item.meaning,
        rootForm: null,
      });
      const rest = spelling.slice(norm.length);
      if (rest) {
        segments.push({ form: rest, type: 'root', meaning: '词干', rootForm: null });
      }
      return segments;
    }
  }

  return [{ form: item.form, type: 'root', meaning: item.meaning, rootForm: item.kind === 'root' ? norm : null }];
}

export function buildExampleSentence(item: RootListItem, derivative: string): { en: string; zh: string } {
  const norm = normalizeMorphemeForm(item.form);
  if (item.kind === 'root') {
    return {
      en: `In ${derivative}, the root "${norm}" carries the idea of ${item.meaning}.`,
      zh: `在 ${derivative} 中，词根 ${norm} 承载「${item.meaning}」的核心义。`,
    };
  }
  if (item.kind === 'prefix') {
    return {
      en: `The prefix in ${derivative} shifts the word toward "${item.meaning}".`,
      zh: `${derivative} 中的前缀把词义引向「${item.meaning}」。`,
    };
  }
  if (item.kind === 'suffix') {
    return {
      en: `${derivative} ends with ${item.form}, marking "${item.meaning}".`,
      zh: `${derivative} 以 ${item.form} 收尾，体现「${item.meaning}」的语法功能。`,
    };
  }
  return {
    en: `${derivative} combines ${item.form} with another stem in technical English.`,
    zh: `${derivative} 在专业英语里把 ${item.form} 与另一词干组合使用。`,
  };
}

export function expandMorphemeCatalog(catalog: RootListItem[]): {
  details: ExpandedMorphemeDetail[];
  roots: ExpandedSeedRoot[];
  words: ExpandedSeedWord[];
  examples: ExpandedSeedExample[];
} {
  const details: ExpandedMorphemeDetail[] = [];
  const roots: ExpandedSeedRoot[] = [];
  const wordsBySpelling = new Map<string, ExpandedSeedWord>();
  const examples: ExpandedSeedExample[] = [];
  let freq = 200;

  for (const item of catalog) {
    const derivatives = extractDerivativeWords(item.extendedMeaning);
    const story = buildMorphemeStory(item, derivatives);
    const normalizedForm = normalizeMorphemeForm(item.form);

    details.push({
      kind: item.kind,
      form: item.form,
      normalizedForm,
      story,
      derivatives,
    });

    if (item.kind === 'root') {
      roots.push({
        form: normalizedForm,
        origin: item.origin as RootOrigin,
        meaning: item.meaning,
        extendedMeaning: item.extendedMeaning ?? item.meaning,
        story,
      });
    }

    for (const spelling of derivatives) {
      if (!wordsBySpelling.has(spelling)) {
        freq += 1;
        wordsBySpelling.set(spelling, {
          spelling,
          frequency: freq,
          level: item.level === 'advanced' ? ['cet6'] : ['cet4', 'cet6'],
          pos: [guessPos(spelling)],
          splitPattern: buildSplitPattern(item, spelling),
        });
      }
    }

    const exampleWords = derivatives.slice(0, EXAMPLE_LIMIT_PER_MORPHEME);
    for (const spelling of exampleWords) {
      const { en, zh } = buildExampleSentence(item, spelling);
      examples.push({
        spelling,
        ...(item.kind === 'root' ? { targetRootForm: normalizedForm } : {}),
        sentence: en,
        translation: zh,
      });
    }
  }

  return {
    details,
    roots,
    words: [...wordsBySpelling.values()],
    examples,
  };
}
