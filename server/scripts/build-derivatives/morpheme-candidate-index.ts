import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import type { EcdictRow } from './types';
import { isValidEnglishWord, normalizeMorphemeForm, wordContainsMorpheme } from './normalize';
import type { RootListItem } from './types';

export type MorphemeCandidateIndex = Map<string, string[]>;

function morphemeKey(kind: string, form: string): string {
  return `${kind}:${normalizeMorphemeForm(form)}`;
}

export function buildMorphemeCandidateIndex(rows: EcdictRow[]): MorphemeCandidateIndex {
  const catalog = MORPHEME_CATALOG;
  const norms = catalog.map((item) => ({
    item,
    key: morphemeKey(item.kind, item.form),
    norm: normalizeMorphemeForm(item.form),
  }));

  const buckets = new Map<string, Set<string>>();
  for (const { key } of norms) {
    buckets.set(key, new Set());
  }

  let processed = 0;
  for (const row of rows) {
    if (!isValidEnglishWord(row.word)) {
      continue;
    }
    for (const { item, key, norm } of norms) {
      if (wordContainsMorpheme(row.word, item.kind, norm)) {
        const set = buckets.get(key);
        if (set && set.size < 120) {
          set.add(row.word);
        }
      }
    }
    processed += 1;
    if (processed % 100_000 === 0) {
      console.log(`[index] scanned ${processed}/${rows.length} ECDICT rows …`);
    }
  }

  const index: MorphemeCandidateIndex = new Map();
  for (const [key, set] of buckets) {
    index.set(key, [...set]);
  }
  return index;
}

export function getCandidatesForMorpheme(
  index: MorphemeCandidateIndex,
  item: RootListItem,
): string[] {
  return index.get(morphemeKey(item.kind, item.form)) ?? [];
}
