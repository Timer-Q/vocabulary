export interface WordSplitSegment {
  form: string;
  type: 'prefix' | 'root' | 'suffix';
  meaning: string;
  rootId: string | null;
}

export interface WordDetail {
  id: string;
  spelling: string;
  phoneticUk: string | null;
  phoneticUs: string | null;
  audioUkUrl: string | null;
  audioUsUrl: string | null;
  pos: unknown;
  splitPattern: WordSplitSegment[];
  media: Array<{
    type: string;
    url: string;
    thumbUrl: string | null;
  }>;
}

export interface SplitWordResult {
  spelling: string;
  source: 'cache' | 'ai' | 'fallback';
  splitPattern: WordSplitSegment[];
}
