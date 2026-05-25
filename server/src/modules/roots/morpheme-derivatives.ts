import type { MorphemeKind, RootDerivativeItem, RootListItem } from './roots.types';

const DERIVATIVE_SAMPLE_LIMIT = 6;
const ENGLISH_WORD_PATTERN = /[A-Za-z][A-Za-z-]*/g;

const SAMPLE_GLOSS_BY_KIND: Record<MorphemeKind, string> = {
  root: '派生词',
  prefix: '含前缀',
  suffix: '含后缀',
  combining_form: '组合词',
};

function normalizeWord(word: string): string {
  return word.replace(/^-+|-+$/g, '').toLowerCase();
}

export function buildCatalogDerivativeSamples(item: RootListItem): RootDerivativeItem[] {
  const matches = item.extendedMeaning?.match(ENGLISH_WORD_PATTERN) ?? [];
  const seen = new Set<string>();

  return matches
    .map(normalizeWord)
    .filter((word) => {
      if (word.length <= 1 || seen.has(word)) {
        return false;
      }
      seen.add(word);
      return true;
    })
    .slice(0, DERIVATIVE_SAMPLE_LIMIT)
    .map((spelling) => ({
      spelling,
      gloss: SAMPLE_GLOSS_BY_KIND[item.kind],
      isPreview: true,
    }));
}

export function mergeDerivativeSamples(
  derivatives: RootDerivativeItem[],
  samples: RootDerivativeItem[],
): RootDerivativeItem[] {
  const bySpelling = new Map<string, RootDerivativeItem>();
  for (const derivative of derivatives) {
    bySpelling.set(derivative.spelling.toLowerCase(), derivative);
  }
  for (const sample of samples) {
    if (!bySpelling.has(sample.spelling.toLowerCase())) {
      bySpelling.set(sample.spelling.toLowerCase(), sample);
    }
  }

  return [...bySpelling.values()];
}
