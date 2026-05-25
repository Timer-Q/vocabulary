import type {
  ExampleLevel,
  ExampleSource,
  MorphemeKind,
  RootOrigin,
  RootRelationKind,
  WordRelationKind,
  WordRootPosition,
} from '@prisma/client';

export interface SeedPos {
  pos: string;
  meaning: string;
}

export interface SeedSplitSegment {
  form: string;
  type: WordRootPosition;
  meaning: string;
  rootForm: string | null;
}

export interface SeedWord {
  spelling: string;
  phoneticUk?: string;
  phoneticUs?: string;
  frequency: number;
  level: string[];
  pos: SeedPos[];
  splitPattern: SeedSplitSegment[];
}

export interface SeedRoot {
  form: string;
  origin: RootOrigin;
  meaning: string;
  extendedMeaning?: string;
  story?: string;
}

export interface SeedWordRootLink {
  spelling: string;
  rootForm: string;
  position: WordRootPosition;
  order: number;
  displayForm?: string;
}

export interface SeedWordMorphemeLink {
  spelling: string;
  morphemeKind: MorphemeKind;
  morphemeForm: string;
  position: WordRootPosition;
  order: number;
  displayForm?: string;
}

export interface SeedExample {
  spelling: string;
  targetRootForm?: string;
  sentence: string;
  translation: string;
  level: ExampleLevel;
  source: ExampleSource;
  sourceMeta?: Record<string, string | number>;
}

export interface SeedRootRelation {
  from: string;
  to: string;
  kind: RootRelationKind;
}

export interface SeedWordRelation {
  from: string;
  to: string;
  kind: WordRelationKind;
}
