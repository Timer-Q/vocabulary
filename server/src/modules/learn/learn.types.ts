export interface TodayPlan {
  dailyNew: number;
  dailyReview: number;
  examType: string;
  examDate: string | null;
}

export interface TodayLearningPayload {
  newWords: unknown[];
  reviewWords: unknown[];
  plan: TodayPlan | null;
}

export interface AnswerResultPayload {
  nextDueAt: string;
  intervalDays: number;
  easeFactor: number;
  mastery: number;
}
