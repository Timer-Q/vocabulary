import { AnswerResult } from './dto/answer-word.dto';

export interface ReviewState {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  lapses: number;
}

export interface ReviewNextState extends ReviewState {
  mastery: number;
}

const qualityMap: Record<AnswerResult, number> = {
  [AnswerResult.Unknown]: 1,
  [AnswerResult.Vague]: 3,
  [AnswerResult.Known]: 4,
  [AnswerResult.Mastered]: 5,
};

export function calculateNextReview(
  state: ReviewState,
  result: AnswerResult,
  responseMs: number,
): ReviewNextState {
  const adjustedQuality = Math.max(0, qualityMap[result] - (responseMs > 6000 ? 1 : 0));

  if (adjustedQuality < 3) {
    return {
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 0,
      reviewCount: state.reviewCount + 1,
      lapses: state.lapses + 1,
      mastery: 1,
    };
  }

  const nextEaseFactor = Math.max(
    1.3,
    state.easeFactor + (0.1 - (5 - adjustedQuality) * (0.08 + (5 - adjustedQuality) * 0.02)),
  );

  const nextInterval =
    state.reviewCount === 0
      ? 1
      : state.reviewCount === 1
        ? 4
        : Math.round(state.intervalDays * nextEaseFactor);

  return {
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    intervalDays: nextInterval,
    reviewCount: state.reviewCount + 1,
    lapses: state.lapses,
    mastery: Math.min(5, Math.max(2, adjustedQuality)),
  };
}
