export type ReviewResult = 'unknown' | 'vague' | 'known' | 'mastered'

export interface ReviewState {
  easeFactor: number
  intervalDays: number
  reviewCount: number
  lapses: number
}

export interface ReviewNextState extends ReviewState {
  mastery: number
}

const qualityMap: Record<ReviewResult, number> = {
  unknown: 1,
  vague: 3,
  known: 4,
  mastered: 5,
}

export function calculateNextReview(
  state: ReviewState,
  result: ReviewResult,
  responseMs: number,
): ReviewNextState {
  const adjustedQuality = Math.max(0, qualityMap[result] - (responseMs > 6000 ? 1 : 0))

  if (adjustedQuality < 3) {
    return {
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 0,
      reviewCount: state.reviewCount + 1,
      lapses: state.lapses + 1,
      mastery: 1,
    }
  }

  const easeFactor = Math.max(
    1.3,
    state.easeFactor + (0.1 - (5 - adjustedQuality) * (0.08 + (5 - adjustedQuality) * 0.02)),
  )
  const intervalDays =
    state.reviewCount === 0
      ? 1
      : state.reviewCount === 1
        ? 4
        : Math.max(1, Math.round((state.intervalDays || 1) * easeFactor))

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    reviewCount: state.reviewCount + 1,
    lapses: state.lapses,
    mastery: Math.min(5, Math.max(2, adjustedQuality)),
  }
}

export function failedReview(next: ReviewNextState): boolean {
  return next.intervalDays === 0
}
