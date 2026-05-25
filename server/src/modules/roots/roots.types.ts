import type { ExampleItem } from '../examples/examples.types';

export type MorphemeKind = 'root' | 'prefix' | 'suffix' | 'combining_form';
export type MorphemeLevel = 'core' | 'advanced' | 'specialist';

export interface RootListItem {
  id: string;
  kind: MorphemeKind;
  form: string;
  origin: string;
  originLabel: string;
  meaning: string;
  extendedMeaning: string | null;
  level: MorphemeLevel;
  derivativeCount: number;
}

export interface RootListPayload {
  items: RootListItem[];
  total: number;
}

export interface RootDerivativeItem {
  spelling: string;
  gloss: string;
  wordId?: string;
  isPreview?: boolean;
}

export interface RootDetailPayload {
  id: string;
  kind: MorphemeKind;
  level: MorphemeLevel;
  form: string;
  origin: string;
  originLabel: string;
  meaning: string;
  extendedMeaning: string | null;
  story: string | null;
  derivativeCount: number;
  derivatives: RootDerivativeItem[];
  examples: ExampleItem[];
}
