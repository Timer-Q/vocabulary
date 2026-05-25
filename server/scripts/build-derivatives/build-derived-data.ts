import * as fs from 'node:fs';
import * as path from 'node:path';
import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import { DERIVATIVES_CACHE_DIR, ensureDir, readJsonFile } from './paths';
import { cacheFileName } from './paths';
import type { MorphemeDerivativeCache } from './types';
import type { SeedExample, SeedWord, SeedWordMorphemeLink } from '../../prisma/seed-types';
import type { MorphemeKind } from '@prisma/client';

const SEED_DIR = path.resolve(__dirname, '../../prisma/seed');

function loadAllDerivativeCaches(): MorphemeDerivativeCache[] {
  const caches: MorphemeDerivativeCache[] = [];
  for (const item of MORPHEME_CATALOG) {
    const filePath = `${DERIVATIVES_CACHE_DIR}/${cacheFileName(item.kind, item.form)}`;
    const cache = readJsonFile<MorphemeDerivativeCache>(filePath);
    if (cache) {
      caches.push(cache);
    }
  }
  return caches;
}

export function buildDerivedDataFile(): void {
  buildDerivedDataFiles();
}

export function buildDerivedDataFiles(): void {
  const caches = loadAllDerivativeCaches();
  if (caches.length === 0) {
    throw new Error('No derivative caches found; run enrich-llm first');
  }

  const wordsBySpelling = new Map<string, SeedWord>();
  const examples: SeedExample[] = [];
  const links: SeedWordMorphemeLink[] = [];
  const stories: { kind: MorphemeKind; normalizedForm: string; story: string }[] = [];
  const exampleSeen = new Set<string>();

  for (const cache of caches) {
    stories.push({
      kind: cache.kind,
      normalizedForm: cache.normalizedForm,
      story: cache.story,
    });

    cache.words.forEach((word, wordIndex) => {
      const key = word.spelling.toLowerCase();
      if (!wordsBySpelling.has(key)) {
        wordsBySpelling.set(key, {
          spelling: word.spelling,
          phoneticUk: word.phoneticUk ?? undefined,
          phoneticUs: word.phoneticUs ?? undefined,
          frequency: word.frequency,
          level: word.level,
          pos: word.pos,
          splitPattern: word.splitPattern,
        });
      }

      links.push({
        spelling: word.spelling,
        morphemeKind: cache.kind,
        morphemeForm: cache.form,
        position: cache.kind === 'prefix' ? 'prefix' : cache.kind === 'suffix' ? 'suffix' : 'root',
        order: wordIndex,
        displayForm: cache.form,
      });

      const exKey = `${key}::${word.exampleEn}`;
      if (!exampleSeen.has(exKey)) {
        exampleSeen.add(exKey);
        examples.push({
          spelling: word.spelling,
          ...(cache.kind === 'root' ? { targetRootForm: cache.normalizedForm } : {}),
          sentence: word.exampleEn,
          translation: word.exampleZh,
          level: word.exampleLevel,
          source: 'other',
          sourceMeta: { seed: 'derived', morpheme: cache.normalizedForm },
        });
      }
    });
  }

  const words = [...wordsBySpelling.values()];
  ensureDir(SEED_DIR);

  const meta = {
    generatedAt: new Date().toISOString(),
    morphemeCount: caches.length,
    wordCount: words.length,
    exampleCount: examples.length,
    linkCount: links.length,
  };

  fs.writeFileSync(path.join(SEED_DIR, 'derived-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  fs.writeFileSync(path.join(SEED_DIR, 'derived-words.json'), JSON.stringify(words));
  fs.writeFileSync(path.join(SEED_DIR, 'derived-examples.json'), JSON.stringify(examples));
  fs.writeFileSync(
    path.join(SEED_DIR, 'derived-morpheme-links.json'),
    JSON.stringify(links),
  );
  fs.writeFileSync(
    path.join(SEED_DIR, 'derived-morpheme-stories.json'),
    JSON.stringify(stories),
  );

  console.log(`[build] 已写入 ${SEED_DIR}/derived-*.json`);
  console.log(
    `[build] ${caches.length} morphemes, ${words.length} words, ${examples.length} examples`,
  );
}
