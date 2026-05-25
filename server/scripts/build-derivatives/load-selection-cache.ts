import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import { SELECTION_CACHE_DIR, cacheFileName, readJsonFile } from './paths';
import type { MorphemeSelectionCache } from './types';

export function loadSelectionsFromCache(): MorphemeSelectionCache[] {
  const results: MorphemeSelectionCache[] = [];
  for (const item of MORPHEME_CATALOG) {
    const path = `${SELECTION_CACHE_DIR}/${cacheFileName(item.kind, item.form)}`;
    const cache = readJsonFile<MorphemeSelectionCache>(path);
    if (!cache) {
      throw new Error(`Missing selection cache for ${item.kind}:${item.form}; run --stage=select first`);
    }
    results.push(cache);
  }
  return results;
}
