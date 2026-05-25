import * as fs from 'fs';
import * as path from 'path';
import type { MorphemeKind } from '@prisma/client';
import type { SeedExample, SeedWord, SeedWordMorphemeLink } from '../seed-types';

export interface DerivedMorphemeStoryRow {
  kind: MorphemeKind;
  normalizedForm: string;
  story: string;
}

const SEED_DIR = __dirname;

function loadJsonFile<T>(fileName: string, fallback: T): T {
  const filePath = path.join(SEED_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

const emptyWords: SeedWord[] = [];
const emptyExamples: SeedExample[] = [];
const emptyLinks: SeedWordMorphemeLink[] = [];
const emptyStories: DerivedMorphemeStoryRow[] = [];

export const DERIVED_MORPHEME_STORIES = loadJsonFile<DerivedMorphemeStoryRow[]>(
  'derived-morpheme-stories.json',
  emptyStories,
);
export const DERIVED_WORDS = loadJsonFile<SeedWord[]>('derived-words.json', emptyWords);
export const DERIVED_WORD_MORPHEME_LINKS = loadJsonFile<SeedWordMorphemeLink[]>(
  'derived-morpheme-links.json',
  emptyLinks,
);
export const DERIVED_EXAMPLES = loadJsonFile<SeedExample[]>('derived-examples.json', emptyExamples);
