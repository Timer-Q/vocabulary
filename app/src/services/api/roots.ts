import { request } from './client';
import type { MorphemeKind, RootListData, RootOriginKey } from '@/types/roots';
import type { ExampleItem } from './types';

export interface RootDerivativeItem {
  spelling: string;
  gloss: string;
  wordId?: string;
  isPreview?: boolean;
}

export interface RootDetailRemote {
  id: string;
  kind: MorphemeKind;
  level: string;
  form: string;
  origin: string;
  originLabel: string;
  meaning: string;
  extendedMeaning: string | null;
  story: string | null;
  derivativeCount: number;
  derivatives: RootDerivativeItem[];
  examples: ExampleItem[];
}

export const rootsApi = {
  list(q?: string, origin?: RootOriginKey, kind?: MorphemeKind): Promise<RootListData> {
    const params = new URLSearchParams();
    if (q?.trim()) {
      params.set('q', q.trim());
    }
    if (origin) {
      params.set('origin', origin);
    }
    if (kind) {
      params.set('kind', kind);
    }
    const qs = params.toString();
    return request<RootListData>(`/roots${qs ? `?${qs}` : ''}`);
  },

  detail(form: string, kind?: MorphemeKind): Promise<RootDetailRemote> {
    const params = new URLSearchParams();
    if (kind) {
      params.set('kind', kind);
    }
    const qs = params.toString();
    return request<RootDetailRemote>(
      `/roots/${encodeURIComponent(form)}${qs ? `?${qs}` : ''}`,
    );
  },
};
