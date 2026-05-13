import { request } from './client';
import type { AnswerRemotePayload, TodayLearningRemote } from '@/types/learning';

export const learnApi = {
  today(userId = 1): Promise<TodayLearningRemote> {
    return request<TodayLearningRemote>(`/learn/today?userId=${encodeURIComponent(String(userId))}`);
  },

  answer(
    body: {
      wordId: number;
      result: 'unknown' | 'vague' | 'known' | 'mastered';
      responseMs: number;
      sessionId?: string;
      exerciseType?: string;
    },
    userId = 1,
  ): Promise<AnswerRemotePayload> {
    return request<AnswerRemotePayload>(`/learn/answer?userId=${encodeURIComponent(String(userId))}`, {
      method: 'POST',
      data: body,
    });
  },
};
