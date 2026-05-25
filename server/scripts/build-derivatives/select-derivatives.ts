import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import { getEcdictRows, loadEcdict, lookupEcdict } from './download-ecdict';
import {
  buildMorphemeCandidateIndex,
  getCandidatesForMorpheme,
  type MorphemeCandidateIndex,
} from './morpheme-candidate-index';
import { fetchWiktionaryForMorpheme } from './fetch-wiktionary-derived';
import {
  extractCatalogSampleWords,
  isValidEnglishWord,
  normalizeMorphemeForm,
} from './normalize';
import {
  SELECTION_CACHE_DIR,
  cacheFileName,
  ensureDir,
  readJsonFile,
  writeJsonFile,
} from './paths';
import type { EcdictRow, MorphemeSelectionCache, RootListItem, SelectedDerivative } from './types';
import { DERIVATIVE_TARGET_COUNT } from './types';

const CET_TAG_WEIGHT: Record<string, number> = {
  zk: 20,
  gk: 15,
  cet4: 35,
  cet6: 30,
  ky: 28,
  toefl: 22,
  ielts: 22,
  gre: 12,
};

function scoreDerivative(row: EcdictRow): number {
  let score = 0;
  if (row.oxford) {
    score += 100;
  }
  score += row.collins * 8;
  for (const tag of row.tags) {
    score += CET_TAG_WEIGHT[tag] ?? 0;
  }
  if (row.frq !== null) {
    score += Math.max(0, 50 - Math.min(row.frq, 50));
  }
  if (row.bnc !== null) {
    score += Math.max(0, 40 - Math.min(row.bnc, 40));
  }
  return score;
}

function posFromEcdict(row: EcdictRow): { pos: string; meaning: string }[] {
  const translation = row.translation ?? '';
  const meaning = translation.split(/[;；\n]/)[0]?.trim() || translation || '词汇';
  const posRaw = row.pos?.split(/[.\s]/)[0]?.trim().toLowerCase();
  const pos =
    posRaw === 'v' || posRaw === 'vi' || posRaw === 'vt'
      ? 'v'
      : posRaw === 'adj' || posRaw === 'a'
        ? 'adj'
        : posRaw === 'adv'
          ? 'adv'
          : 'n';
  return [{ pos, meaning }];
}

let morphemeCandidateIndex: MorphemeCandidateIndex | null = null;

function ensureCandidateIndex(): MorphemeCandidateIndex {
  if (!morphemeCandidateIndex) {
    console.log('[select] 构建词素候选索引（单次扫描 ECDICT）…');
    morphemeCandidateIndex = buildMorphemeCandidateIndex(getEcdictRows());
  }
  return morphemeCandidateIndex;
}

function rankCandidates(
  spellings: Iterable<string>,
  index: Map<string, EcdictRow>,
  priority: Set<string>,
): SelectedDerivative[] {
  const scored: SelectedDerivative[] = [];
  const seen = new Set<string>();

  for (const spelling of spellings) {
    const key = spelling.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    const row = lookupEcdict(index, key);
    if (!row || !isValidEnglishWord(key)) {
      continue;
    }
    seen.add(key);
    const base = scoreDerivative(row);
    const bonus = priority.has(key) ? 10_000 : 0;
    scored.push({ spelling: key, score: base + bonus, ecdict: row });
  }

  scored.sort((a, b) => b.score - a.score || a.spelling.localeCompare(b.spelling));
  return scored;
}

export async function selectForMorpheme(item: RootListItem): Promise<MorphemeSelectionCache> {
  const normalizedForm = normalizeMorphemeForm(item.form);
  const cachePath = `${SELECTION_CACHE_DIR}/${cacheFileName(item.kind, item.form)}`;
  const cached = readJsonFile<MorphemeSelectionCache>(cachePath);
  if (cached) {
    return cached;
  }

  const index = await loadEcdict();
  const wiktionary =
    process.env.SKIP_WIKTIONARY === '1'
      ? { words: [] as string[] }
      : await fetchWiktionaryForMorpheme(item);
  const catalogSamples = extractCatalogSampleWords(item.extendedMeaning);
  const priority = new Set(catalogSamples);

  const candidateIndex = ensureCandidateIndex();
  const ecdictCandidates = getCandidatesForMorpheme(candidateIndex, item);
  const allCandidates = new Set<string>([
    ...wiktionary.words.map((w) => w.toLowerCase()),
    ...ecdictCandidates,
    ...catalogSamples,
  ]);

  const ranked = rankCandidates(allCandidates, index, priority);
  const top = ranked.slice(0, DERIVATIVE_TARGET_COUNT);

  for (const sample of catalogSamples) {
    if (top.length >= DERIVATIVE_TARGET_COUNT) {
      break;
    }
    if (!top.some((t) => t.spelling === sample)) {
      const row = lookupEcdict(index, sample);
      if (row) {
        top.push({ spelling: sample, score: 10_000 + scoreDerivative(row), ecdict: row });
      }
    }
  }

  const derivatives = top.slice(0, DERIVATIVE_TARGET_COUNT);

  const result: MorphemeSelectionCache = {
    kind: item.kind,
    form: item.form,
    normalizedForm,
    meaning: item.meaning,
    originLabel: item.originLabel,
    level: item.level,
    derivatives,
    selectedAt: new Date().toISOString(),
  };

  ensureDir(SELECTION_CACHE_DIR);
  writeJsonFile(cachePath, result);
  return result;
}

export async function selectAllDerivatives(): Promise<MorphemeSelectionCache[]> {
  ensureDir(SELECTION_CACHE_DIR);
  const index = await loadEcdict();
  void index;

  const results: MorphemeSelectionCache[] = [];
  for (let i = 0; i < MORPHEME_CATALOG.length; i += 1) {
    const item = MORPHEME_CATALOG[i];
    const selection = await selectForMorpheme(item);
    results.push(selection);
    if ((i + 1) % 25 === 0 || i === MORPHEME_CATALOG.length - 1) {
      console.log(
        `[select] ${i + 1}/${MORPHEME_CATALOG.length} ${item.form} → ${selection.derivatives.length} 词`,
      );
    }
  }
  return results;
}

export { posFromEcdict, scoreDerivative };
