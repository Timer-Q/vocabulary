import { MORPHEME_CATALOG } from '@/data/morpheme-catalog';
import type { RootDerivative } from '@/types/learning';
import type { MorphemeKind, RootListItem } from '@/types/roots';

const DERIVATIVE_SAMPLE_LIMIT = 6;
const ENGLISH_WORD_PATTERN = /[A-Za-z][A-Za-z-]*/g;

const SAMPLE_GLOSS_BY_KIND: Record<MorphemeKind, string> = {
  root: '派生词',
  prefix: '含前缀',
  suffix: '含后缀',
  combining_form: '组合词',
};

function normalizeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

function normalizeWord(word: string): string {
  return word.replace(/^-+|-+$/g, '').toLowerCase();
}

export function buildCatalogDerivativeSamples(item: RootListItem): RootDerivative[] {
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

export function findCatalogMorpheme(form: string, kind?: MorphemeKind): RootListItem | undefined {
  const normalized = normalizeForm(form);
  return MORPHEME_CATALOG.find(
    (item) =>
      normalizeForm(item.form) === normalized && (kind === undefined || item.kind === kind),
  );
}

export function mergeCatalogDerivativeSamples(
  derivatives: RootDerivative[],
  form: string,
  kind: MorphemeKind,
): RootDerivative[] {
  const catalogItem = findCatalogMorpheme(form, kind);
  if (!catalogItem) {
    return derivatives;
  }

  const bySpelling = new Map<string, RootDerivative>();
  for (const derivative of derivatives) {
    bySpelling.set(derivative.spelling.toLowerCase(), derivative);
  }
  for (const derivative of buildCatalogDerivativeSamples(catalogItem)) {
    if (!bySpelling.has(derivative.spelling.toLowerCase())) {
      bySpelling.set(derivative.spelling.toLowerCase(), derivative);
    }
  }

  return [...bySpelling.values()];
}
