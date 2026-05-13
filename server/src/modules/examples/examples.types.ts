export interface ExampleItem {
  id: string;
  wordId: string;
  level: string;
  source: string;
  sourceMeta: unknown;
  sentence: string;
  translation: string;
  audioUkUrl: string | null;
  audioUsUrl: string | null;
  audioSlowUrl: string | null;
  highlightSpans: unknown;
  grammarTags: unknown;
  likes: number;
}

export interface ExampleSubmissionResult {
  submissionId: string;
  status: 'pending';
}
