import type { MorphemeKind } from '@prisma/client';
import { ENGLISH_WORD_PATTERN } from './types';

export function normalizeMorphemeForm(form: string): string {
  return form.replace(/^-+|-+$/g, '').toLowerCase();
}

export function extractCatalogSampleWords(extendedMeaning: string | null | undefined): string[] {
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
    });
}

export function wordContainsMorpheme(
  spelling: string,
  kind: MorphemeKind,
  normalizedForm: string,
): boolean {
  const lower = spelling.toLowerCase();
  const bare = normalizedForm.replace(/^-+|-+$/g, '');

  if (bare.length < 1) {
    return false;
  }
  if (kind === 'root' && bare.length < 2) {
    return false;
  }

  switch (kind) {
    case 'prefix':
      return lower.startsWith(bare);
    case 'suffix':
      return lower.endsWith(bare);
    case 'combining_form':
      return lower.startsWith(bare) || lower.includes(bare);
    case 'root':
    default:
      return lower.includes(bare);
  }
}

export function isValidEnglishWord(spelling: string): boolean {
  return /^[a-z][a-z-]{2,17}$/i.test(spelling);
}
