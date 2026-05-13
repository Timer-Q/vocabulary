import type { ExampleItem, WordDetail } from '@/services/api/types';

/** Tab 学习会话模式（与后端 learn 概念对齐） */
export type SessionMode = 'idle' | 'new' | 'review';

/** 与 `POST /v1/learn/answer` 的 result 枚举一致 */
export type AnswerGrade = 'unknown' | 'vague' | 'known' | 'mastered';

/** 单词卡 + 例句，会话队列元素 */
export interface LearningCardBundle {
  word: WordDetail;
  examples: ExampleItem[];
}

export interface PlanSummary {
  dailyNew: number;
  dailyReview: number;
  examType: string | null;
  examDate: string | null;
}

export interface RootDerivative {
  spelling: string;
  gloss: string;
}

export interface RootDetailData {
  id: string;
  form: string;
  originKey: 'latin' | 'greek' | 'old_english' | 'french' | 'other';
  originLabel: string;
  meaning: string;
  extendedMeaning?: string;
  story?: string;
  derivatives: RootDerivative[];
  examples: ExampleItem[];
}

export interface LearningReport {
  title: string;
  subtitle: string;
  weekLabels: string[];
  dailyMinutes: number[];
  accuracyPct: number;
  wordsLearned: number;
  reviewDone: number;
  streakDays: number;
  rootCoverage: { form: string; percent: number }[];
  achievements: { title: string; description: string }[];
}

export interface TodayLearningRemote {
  newWords: unknown[];
  reviewWords: unknown[];
  plan: {
    dailyNew: number;
    dailyReview: number;
    examType: string;
    examDate: string | null;
  } | null;
}

export interface AnswerRemotePayload {
  nextDueAt: string;
  intervalDays: number;
  easeFactor: number;
  mastery: number;
}
