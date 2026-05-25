import type { Word } from '@prisma/client';

/** 今日学习清单中的单词简要（可安全 JSON 序列化） */
export interface TodayWordBrief {
  id: string;
  spelling: string;
  phoneticUk: string | null;
  phoneticUs: string | null;
  audioUkUrl: string | null;
  audioUsUrl: string | null;
  pos: unknown;
  splitPattern: unknown;
  level: unknown;
}

export function mapWordToTodayBrief(word: Word): TodayWordBrief {
  return {
    id: word.id.toString(),
    spelling: word.spelling,
    phoneticUk: word.phoneticUk,
    phoneticUs: word.phoneticUs,
    audioUkUrl: word.audioUkUrl,
    audioUsUrl: word.audioUsUrl,
    pos: word.pos,
    splitPattern: word.splitPattern,
    level: word.level,
  };
}
