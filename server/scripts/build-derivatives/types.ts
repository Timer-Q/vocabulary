import type { ExampleLevel, MorphemeKind } from '@prisma/client';
import type { RootListItem } from '../../src/modules/roots/roots.types';
import type { SeedPos, SeedSplitSegment } from '../../prisma/seed-types';

export type { RootListItem };

export interface EcdictRow {
  word: string;
  phonetic: string | null;
  definition: string | null;
  translation: string | null;
  pos: string | null;
  collins: number;
  oxford: boolean;
  tags: string[];
  bnc: number | null;
  frq: number | null;
}

export interface WiktionaryCacheEntry {
  kind: MorphemeKind;
  form: string;
  normalizedForm: string;
  words: string[];
  fetchedAt: string;
}

export interface SelectedDerivative {
  spelling: string;
  score: number;
  ecdict: EcdictRow;
}

export interface MorphemeSelectionCache {
  kind: MorphemeKind;
  form: string;
  normalizedForm: string;
  meaning: string;
  originLabel: string;
  level: string;
  derivatives: SelectedDerivative[];
  selectedAt: string;
}

export interface LlmSplitSegment {
  form: string;
  type: 'prefix' | 'root' | 'suffix';
  meaning: string;
  rootForm: string | null;
}

export interface LlmWordEnrichment {
  splitPattern: LlmSplitSegment[];
  exampleEn: string;
  exampleZh: string;
  exampleLevel: ExampleLevel;
}

export interface MorphemeDerivativeCache {
  kind: MorphemeKind;
  form: string;
  normalizedForm: string;
  meaning: string;
  story: string;
  words: EnrichedDerivative[];
  enrichedAt: string;
}

export interface EnrichedDerivative {
  spelling: string;
  phoneticUk: string | null;
  phoneticUs: string | null;
  frequency: number;
  level: string[];
  pos: SeedPos[];
  splitPattern: SeedSplitSegment[];
  exampleEn: string;
  exampleZh: string;
  exampleLevel: ExampleLevel;
  score: number;
}

export interface DerivedMorphemeStory {
  kind: MorphemeKind;
  normalizedForm: string;
  story: string;
}

export const DERIVATIVE_TARGET_COUNT = 30;
export const ENGLISH_WORD_PATTERN = /[A-Za-z][A-Za-z-]*/g;
