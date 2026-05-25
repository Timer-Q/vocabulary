export interface TodayPlan {
  dailyNew: number;
  dailyReview: number;
  examType: string;
  examDate: string | null;
}

import type { TodayWordBrief } from './learn-word.mapper';

export interface TodayLearningPayload {
  newWords: TodayWordBrief[];
  reviewWords: TodayWordBrief[];
  plan: TodayPlan | null;
}

export interface AnswerResultPayload {
  nextDueAt: string;
  intervalDays: number;
  easeFactor: number;
  mastery: number;
}
