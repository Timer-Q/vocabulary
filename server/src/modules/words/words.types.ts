export interface WordSplitSegment {
  form: string;
  type: 'prefix' | 'root' | 'suffix';
  meaning: string;
  rootId: string | null;
  rootForm?: string | null;
}

export interface PosEntry {
  pos: string;
  meaning: string;
}

export interface WordScene {
  title: string;
  description?: string;
}

export interface WordDetail {
  id: string;
  spelling: string;
  phoneticUk: string | null;
  phoneticUs: string | null;
  audioUkUrl: string | null;
  audioUsUrl: string | null;
  audioSlowUrl: string | null;
  frequency: number | null;
  difficulty: number | null;
  level: string[];
  pos: PosEntry[];
  scenes: WordScene[];
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
