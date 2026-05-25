import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import {
  expandMorphemeCatalog,
  type ExpandedSeedExample,
  type ExpandedSeedWord,
} from '../../src/modules/roots/morpheme-detail-expander';
import type { ExampleLevel, ExampleSource } from '@prisma/client';
import type { SeedExample, SeedRoot, SeedWord, SeedWordMorphemeLink, SeedWordRootLink } from '../seed-types';
import {
  DERIVED_EXAMPLES,
  DERIVED_MORPHEME_STORIES,
  DERIVED_WORDS,
  DERIVED_WORD_MORPHEME_LINKS,
} from './derived-data';

export interface MorphemeEtymologySeed {
  kind: string;
  form: string;
  normalizedForm: string;
  story: string;
}

const catalogExpanded = expandMorphemeCatalog(MORPHEME_CATALOG);

const catalogEtymologySeeds: MorphemeEtymologySeed[] = catalogExpanded.details.map((d) => ({
  kind: d.kind,
  form: d.form,
  normalizedForm: d.normalizedForm,
  story: d.story,
}));

const derivedEtymologySeeds: MorphemeEtymologySeed[] = DERIVED_MORPHEME_STORIES.map((row) => ({
  kind: row.kind,
  form: row.normalizedForm,
  normalizedForm: row.normalizedForm,
  story: row.story,
}));

export const MORPHEME_ETYMOLOGY_SEEDS: MorphemeEtymologySeed[] = mergeMorphemeEtymologySeeds(
  catalogEtymologySeeds,
  derivedEtymologySeeds,
);

export function mergeMorphemeEtymologySeeds(
  catalog: MorphemeEtymologySeed[],
  derived: MorphemeEtymologySeed[],
): MorphemeEtymologySeed[] {
  const byKey = new Map<string, MorphemeEtymologySeed>();
  for (const item of catalog) {
    byKey.set(`${item.kind}:${item.normalizedForm}`, item);
  }
  for (const item of derived) {
    byKey.set(`${item.kind}:${item.normalizedForm}`, item);
  }
  return [...byKey.values()];
}

function toSeedWord(word: ExpandedSeedWord): SeedWord {
  return {
    spelling: word.spelling,
    frequency: word.frequency,
    level: word.level,
    pos: word.pos,
    splitPattern: word.splitPattern,
  };
}

function toSeedExample(example: ExpandedSeedExample, index: number): SeedExample {
  return {
    spelling: example.spelling,
    targetRootForm: example.targetRootForm,
    sentence: example.sentence,
    translation: example.translation,
    level: 'basic' as ExampleLevel,
    source: 'other' as ExampleSource,
    sourceMeta: { seed: 'catalog', index },
  };
}

export function mergeSeedRoots(manual: SeedRoot[]): SeedRoot[] {
  const byForm = new Map<string, SeedRoot>();
  for (const root of catalogExpanded.roots) {
    byForm.set(root.form, root);
  }
  for (const root of manual) {
    byForm.set(root.form, root);
  }
  return [...byForm.values()];
}

export function mergeSeedWords(manual: SeedWord[]): SeedWord[] {
  const bySpelling = new Map<string, SeedWord>();
  for (const word of catalogExpanded.words.map(toSeedWord)) {
    bySpelling.set(word.spelling.toLowerCase(), word);
  }
  for (const word of DERIVED_WORDS) {
    bySpelling.set(word.spelling.toLowerCase(), word);
  }
  for (const word of manual) {
    bySpelling.set(word.spelling.toLowerCase(), word);
  }
  return [...bySpelling.values()];
}

export function mergeSeedExamples(manual: SeedExample[]): SeedExample[] {
  const seen = new Set<string>();
  const merged: SeedExample[] = [];

  const append = (ex: SeedExample): void => {
    const key = `${ex.spelling.toLowerCase()}::${ex.sentence}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(ex);
  };

  catalogExpanded.examples.forEach((ex, index) => {
    append(toSeedExample(ex, index));
  });
  for (const ex of DERIVED_EXAMPLES) {
    append(ex);
  }
  for (const ex of manual) {
    append(ex);
  }

  return merged;
}

export function mergeMorphemeWordLinks(
  catalogLinks: SeedWordMorphemeLink[],
  derived: SeedWordMorphemeLink[],
): SeedWordMorphemeLink[] {
  const byKey = new Map<string, SeedWordMorphemeLink>();
  for (const link of catalogLinks) {
    byKey.set(`${link.spelling.toLowerCase()}:${link.order}`, link);
  }
  for (const link of derived) {
    byKey.set(`${link.spelling.toLowerCase()}:${link.order}`, link);
  }
  return [...byKey.values()];
}

function buildMorphemeLinksFromWords(words: SeedWord[]): SeedWordMorphemeLink[] {
  const links: SeedWordMorphemeLink[] = [];
  for (const word of words) {
    word.splitPattern.forEach((seg, order) => {
      if (seg.rootForm) {
        links.push({
          spelling: word.spelling,
          morphemeKind: 'root',
          morphemeForm: seg.rootForm,
          position: 'root',
          order,
          displayForm: seg.form,
        });
      } else if (seg.type === 'prefix') {
        links.push({
          spelling: word.spelling,
          morphemeKind: 'prefix',
          morphemeForm: seg.form,
          position: 'prefix',
          order,
          displayForm: seg.form,
        });
      } else if (seg.type === 'suffix') {
        links.push({
          spelling: word.spelling,
          morphemeKind: 'suffix',
          morphemeForm: seg.form,
          position: 'suffix',
          order,
          displayForm: seg.form,
        });
      }
    });
  }
  return links;
}

export function mergeDerivedMorphemeWordLinks(
  catalogLinks: SeedWordMorphemeLink[],
): SeedWordMorphemeLink[] {
  return mergeMorphemeWordLinks(catalogLinks, DERIVED_WORD_MORPHEME_LINKS);
}

export function buildWordRootLinksFromWords(words: SeedWord[]): SeedWordRootLink[] {
  const links: SeedWordRootLink[] = [];
  for (const word of words) {
    word.splitPattern.forEach((seg, order) => {
      if (seg.rootForm) {
        links.push({
          spelling: word.spelling,
          rootForm: seg.rootForm,
          position: 'root',
          order,
          displayForm: seg.form,
        });
      }
    });
  }
  return links;
}

export function mergeWordRootLinks(manual: SeedWordRootLink[], words: SeedWord[]): SeedWordRootLink[] {
  const byKey = new Map<string, SeedWordRootLink>();
  for (const link of buildWordRootLinksFromWords(words)) {
    byKey.set(`${link.spelling}:${link.order}`, link);
  }
  for (const link of manual) {
    byKey.set(`${link.spelling}:${link.order}`, link);
  }
  return [...byKey.values()];
}
