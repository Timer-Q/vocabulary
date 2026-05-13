export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
  requestId?: string;
}

export interface WordSplitSegment {
  form: string;
  type: 'prefix' | 'root' | 'suffix';
  meaning: string;
  rootId: string | null;
}

export interface PosEntry {
  pos: string;
  meaning: string;
}

export interface ExampleHighlightSpan {
  start: number;
  end: number;
  type: string;
}

/** 例句来源元信息：按来源松散结构，避免 unknown 泄漏到 UI */
export type ExampleSourceMeta = Record<string, string | number | boolean> | null;

export interface WordDetail {
  id: string;
  spelling: string;
  phoneticUk: string | null;
  phoneticUs: string | null;
  audioUkUrl: string | null;
  audioUsUrl: string | null;
  pos: PosEntry[];
  splitPattern: WordSplitSegment[];
  media: Array<{
    type: string;
    url: string;
    thumbUrl: string | null;
  }>;
}

export interface ExampleItem {
  id: string;
  wordId: string;
  level: 'basic' | 'exam' | 'classic' | 'advanced' | 'root_transfer';
  source: string;
  sourceMeta: ExampleSourceMeta;
  sentence: string;
  translation: string;
  audioUkUrl: string | null;
  audioUsUrl: string | null;
  audioSlowUrl: string | null;
  highlightSpans: ExampleHighlightSpan[] | null;
  grammarTags: string[] | null;
  likes: number;
}
