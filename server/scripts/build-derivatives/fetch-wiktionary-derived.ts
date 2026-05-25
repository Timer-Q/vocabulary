import { MORPHEME_CATALOG } from '../../src/modules/roots/morpheme-catalog';
import { normalizeMorphemeForm } from './normalize';
import {
  WIKTIONARY_CACHE_DIR,
  cacheFileName,
  ensureDir,
  readJsonFile,
  sleep,
  writeJsonFile,
} from './paths';
import type { MorphemeKind } from '@prisma/client';
import type { RootListItem } from './types';
import type { WiktionaryCacheEntry } from './types';

const WIKTIONARY_API = 'https://en.wiktionary.org/w/api.php';
const RATE_LIMIT_MS = 2800;
const MAX_RETRIES = 4;

function wiktionaryCategoryTitle(kind: MorphemeKind, form: string): string | null {
  const bare = form.replace(/^-+|-+$/g, '');
  if (!bare) {
    return null;
  }

  switch (kind) {
    case 'prefix': {
      const prefix = bare.endsWith('-') ? bare : `${bare}-`;
      return `Category:English_words_prefixed_with_${prefix}`;
    }
    case 'suffix': {
      const suffix = bare.startsWith('-') ? bare : `-${bare}`;
      return `Category:English_words_suffixed_with_${suffix}`;
    }
    case 'combining_form':
      return `Category:English_words_prefixed_with_${bare}-`;
    case 'root':
    default:
      return null;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VocabularyApp/1.0 (educational; contact@local)' },
    });
    if (res.status === 429) {
      const waitMs = RATE_LIMIT_MS * (attempt + 2);
      console.warn(`[wiktionary] 429 rate limit, wait ${waitMs}ms …`);
      await sleep(waitMs);
      lastError = new Error(`Wiktionary HTTP 429`);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Wiktionary HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }
  throw lastError ?? new Error('Wiktionary request failed');
}

async function fetchCategoryMembers(categoryTitle: string): Promise<string[]> {
  const words: string[] = [];
  let continueToken: string | undefined;

  do {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: categoryTitle,
      cmlimit: '500',
      format: 'json',
      cmtype: 'page',
    });
    if (continueToken) {
      params.set('cmcontinue', continueToken);
    }

    const url = `${WIKTIONARY_API}?${params.toString()}`;
    const data = await fetchJson<{
      continue?: { cmcontinue?: string };
      query?: { categorymembers?: { title: string; ns: number }[] };
    }>(url);

    const members = data.query?.categorymembers ?? [];
    for (const member of members) {
      if (member.ns === 0) {
        const title = member.title.replace(/_/g, ' ').toLowerCase();
        if (/^[a-z][a-z -]*$/.test(title)) {
          words.push(title.replace(/\s+/g, ''));
        }
      }
    }
    continueToken = data.continue?.cmcontinue;
    if (continueToken) {
      await sleep(RATE_LIMIT_MS);
    }
  } while (continueToken);

  return words;
}

function extractDerivedTermsFromWikitext(wikitext: string): string[] {
  const sectionMatch = wikitext.match(
    /==+\s*Derived terms\s*==+([\s\S]*?)(?=\n==+[^=]|$)/i,
  );
  if (!sectionMatch) {
    return [];
  }

  const block = sectionMatch[1];
  const words: string[] = [];
  const linePattern = /^\*+\s*(?:\[\[)?([A-Za-z][A-Za-z -]*)/gm;
  let match: RegExpExecArray | null;
  while ((match = linePattern.exec(block)) !== null) {
    const word = match[1].split('|')[0].trim().toLowerCase().replace(/\s+/g, '');
    if (word.length >= 3) {
      words.push(word);
    }
  }
  return words;
}

async function fetchRootDerivedTerms(pageTitle: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'parse',
    page: pageTitle,
    prop: 'wikitext',
    format: 'json',
  });
  const url = `${WIKTIONARY_API}?${params.toString()}`;
  const data = await fetchJson<{ parse?: { wikitext?: { '*': string } } }>(url);
  const wikitext = data.parse?.wikitext?.['*'] ?? '';
  return extractDerivedTermsFromWikitext(wikitext);
}

export async function fetchWiktionaryForMorpheme(item: RootListItem): Promise<WiktionaryCacheEntry> {
  const normalizedForm = normalizeMorphemeForm(item.form);
  const cachePath = `${WIKTIONARY_CACHE_DIR}/${cacheFileName(item.kind, item.form)}`;
  const cached = readJsonFile<WiktionaryCacheEntry>(cachePath);
  if (cached) {
    return cached;
  }

  const words = new Set<string>();
  const categoryTitle = wiktionaryCategoryTitle(item.kind, item.form);

  if (categoryTitle) {
    try {
      const members = await fetchCategoryMembers(categoryTitle);
      for (const w of members) {
        words.add(w);
      }
    } catch (err) {
      console.warn(`[wiktionary] category ${categoryTitle}:`, err instanceof Error ? err.message : err);
    }
    await sleep(RATE_LIMIT_MS);
  }

  if (item.kind === 'root') {
    try {
      const derived = await fetchRootDerivedTerms(normalizedForm);
      for (const w of derived) {
        words.add(w);
      }
    } catch {
      try {
        const derived = await fetchRootDerivedTerms(item.form);
        for (const w of derived) {
          words.add(w);
        }
      } catch (err) {
        console.warn(`[wiktionary] root page ${item.form}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  const entry: WiktionaryCacheEntry = {
    kind: item.kind,
    form: item.form,
    normalizedForm,
    words: [...words],
    fetchedAt: new Date().toISOString(),
  };

  ensureDir(WIKTIONARY_CACHE_DIR);
  writeJsonFile(cachePath, entry);
  return entry;
}

export async function fetchAllWiktionary(force = false): Promise<void> {
  ensureDir(WIKTIONARY_CACHE_DIR);
  const catalog = MORPHEME_CATALOG;
  console.log(`[wiktionary] 拉取 ${catalog.length} 个词素 …`);

  for (let i = 0; i < catalog.length; i += 1) {
    const item = catalog[i];
    const cachePath = `${WIKTIONARY_CACHE_DIR}/${cacheFileName(item.kind, item.form)}`;
    if (!force && readJsonFile<WiktionaryCacheEntry>(cachePath)) {
      if ((i + 1) % 50 === 0) {
        console.log(`[wiktionary] 跳过缓存 ${i + 1}/${catalog.length}`);
      }
      continue;
    }

    const entry = await fetchWiktionaryForMorpheme(item);
    console.log(`[wiktionary] ${item.kind}:${item.form} → ${entry.words.length} 词`);
    await sleep(RATE_LIMIT_MS);
  }
}
