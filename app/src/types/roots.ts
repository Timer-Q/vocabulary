export type RootOriginKey = 'latin' | 'greek' | 'old_english' | 'french' | 'other';
export type MorphemeKind = 'root' | 'prefix' | 'suffix' | 'combining_form';
export type MorphemeLevel = 'core' | 'advanced' | 'specialist';

export interface RootListItem {
  id: string;
  kind: MorphemeKind;
  form: string;
  origin: RootOriginKey;
  originLabel: string;
  meaning: string;
  extendedMeaning: string | null;
  level: MorphemeLevel;
  derivativeCount: number;
}

export interface RootListData {
  items: RootListItem[];
  total: number;
}
