import { getMvpBundleBySpelling, getMvpBundles } from '@/data/mvp';
import type { LearningCardBundle, TodayLearningRemote } from '@/types/learning';
import type { WordSplitSegment, WordDetail } from '@/services/api/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.length > 0) {
      return v;
    }
  }
  return null;
}

function pickId(obj: Record<string, unknown>): string | null {
  const raw = obj.id ?? obj.wordId;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw;
  }
  return null;
}

function normalizeSplitPattern(raw: unknown): WordSplitSegment[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: WordSplitSegment[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const form = pickString(item, ['form', 'text']);
    const meaning = pickString(item, ['meaning', 'gloss']);
    const type = item.type;
    if (!form || !meaning || (type !== 'prefix' && type !== 'root' && type !== 'suffix')) {
      continue;
    }
    const rootRaw = item.rootId ?? item.root_id;
    let rootId: string | null = null;
    if (typeof rootRaw === 'number' && Number.isFinite(rootRaw)) {
      rootId = String(rootRaw);
    } else if (typeof rootRaw === 'string') {
      rootId = rootRaw;
    }
    out.push({ form, type, meaning, rootId });
  }
  return out.length > 0 ? out : null;
}

function normalizeLevelTags(raw: unknown): WordDetail['level'] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out = raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
  return out.length > 0 ? out : null;
}

function normalizePos(raw: unknown): WordDetail['pos'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: WordDetail['pos'] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const pos = pickString(item, ['pos', 'label']);
    const meaning = pickString(item, ['meaning', 'gloss']);
    if (pos && meaning) {
      out.push({ pos, meaning });
    }
  }
  return out;
}

/**
 * 将 `/learn/today` 返回的单词行映射为 `WordDetail`；字段不足时用 MVP 同拼写数据补齐。
 */
export function wordRowToDetail(row: unknown): WordDetail | null {
  if (!isRecord(row)) {
    return null;
  }
  const spelling = pickString(row, ['spelling', 'word']);
  if (!spelling) {
    return null;
  }
  const id = pickId(row) ?? spelling;
  const fallback = getMvpBundleBySpelling(spelling);

  const splitPattern =
    normalizeSplitPattern(row.splitPattern ?? row.split_pattern) ?? fallback?.word.splitPattern ?? [];

  const posParsed = normalizePos(row.pos);
  const base: WordDetail = {
    id,
    spelling: spelling.toLowerCase(),
    phoneticUk: pickString(row, ['phoneticUk', 'phonetic_uk']) ?? fallback?.word.phoneticUk ?? null,
    phoneticUs: pickString(row, ['phoneticUs', 'phonetic_us']) ?? fallback?.word.phoneticUs ?? null,
    audioUkUrl: pickString(row, ['audioUkUrl', 'audio_uk_url']) ?? fallback?.word.audioUkUrl ?? null,
    audioUsUrl: pickString(row, ['audioUsUrl', 'audio_us_url']) ?? fallback?.word.audioUsUrl ?? null,
    audioSlowUrl:
      pickString(row, ['audioSlowUrl', 'audio_slow_url']) ?? fallback?.word.audioSlowUrl ?? null,
    frequency:
      typeof row.frequency === 'number' && Number.isFinite(row.frequency)
        ? row.frequency
        : (fallback?.word.frequency ?? null),
    difficulty:
      typeof row.difficulty === 'number' && Number.isFinite(row.difficulty)
        ? row.difficulty
        : (fallback?.word.difficulty ?? null),
    level: normalizeLevelTags(row.level) ?? fallback?.word.level ?? [],
    pos: posParsed.length > 0 ? posParsed : (fallback?.word.pos ?? []),
    scenes: fallback?.word.scenes ?? [],
    splitPattern:
      splitPattern.length > 0
        ? splitPattern
        : [{ form: spelling, type: 'root', meaning: '待补充', rootId: null }],
    media: Array.isArray(row.media) ? (row.media as WordDetail['media']) : (fallback?.word.media ?? []),
  };

  return base;
}

export function mergeBundleFromRemoteWord(row: unknown): LearningCardBundle | null {
  const detail = wordRowToDetail(row);
  if (!detail) {
    return null;
  }
  const local = getMvpBundleBySpelling(detail.spelling);
  return {
    word: {
      ...detail,
      splitPattern:
        detail.splitPattern.length > 0 && !(detail.splitPattern.length === 1 && detail.splitPattern[0]?.meaning === '待补充')
          ? detail.splitPattern
          : local?.word.splitPattern ?? detail.splitPattern,
      pos: detail.pos.length > 0 ? detail.pos : local?.word.pos ?? [],
      media: detail.media.length > 0 ? detail.media : local?.word.media ?? [],
    },
    examples: local?.examples ?? [],
  };
}

function dedupeBundles(list: LearningCardBundle[]): LearningCardBundle[] {
  const seen = new Set<string>();
  const out: LearningCardBundle[] = [];
  for (const b of list) {
    const k = b.word.spelling.toLowerCase();
    if (seen.has(k)) {
      continue;
    }
    seen.add(k);
    out.push(b);
  }
  return out;
}

function mapRows(rows: unknown[]): LearningCardBundle[] {
  return dedupeBundles(
    rows
      .map((row) => mergeBundleFromRemoteWord(row))
      .filter((b): b is LearningCardBundle => b !== null),
  );
}

export function partitionBundlesFromToday(remote: TodayLearningRemote): {
  newBundles: LearningCardBundle[];
  reviewBundles: LearningCardBundle[];
} {
  const newBundles = mapRows(remote.newWords);
  const reviewBundles = mapRows(remote.reviewWords);
  return {
    newBundles: newBundles.length > 0 ? newBundles : getMvpBundles(),
    reviewBundles: reviewBundles.length > 0 ? reviewBundles : getMvpBundles(),
  };
}
