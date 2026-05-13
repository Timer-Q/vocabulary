import { request } from './client';
import { learnApi } from './learn';
import type { ExampleItem, WordDetail } from './types';

export const api = {
  learn: learnApi,
  words: {
    detail(spelling: string): Promise<WordDetail> {
      return request<WordDetail>(`/words/${encodeURIComponent(spelling)}`);
    },
  },
  examples: {
    list(wordId: string): Promise<ExampleItem[]> {
      return request<ExampleItem[]>(`/examples?wordId=${encodeURIComponent(wordId)}`);
    },
  },
};
