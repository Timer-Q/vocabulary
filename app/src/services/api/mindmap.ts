import { request } from './client';
import type { MindmapDimension, MindmapGraph, MindmapThemeSummary } from '@/types/mindmap';
import type { MorphemeKind } from '@/types/roots';

export const mindmapApi = {
  byRoot(rootId: string, dimension: MindmapDimension = 'mixed', depth = 2): Promise<MindmapGraph> {
    const params = new URLSearchParams({
      depth: String(depth),
      dimension,
    });
    return request<MindmapGraph>(`/roots/${encodeURIComponent(rootId)}/mindmap?${params.toString()}`);
  },

  byForm(
    form: string,
    dimension: MindmapDimension = 'mixed',
    depth = 2,
    kind?: MorphemeKind,
  ): Promise<MindmapGraph> {
    const params = new URLSearchParams({
      depth: String(depth),
      dimension,
    });
    if (kind) {
      params.set('kind', kind);
    }
    return request<MindmapGraph>(
      `/mindmap/by-form/${encodeURIComponent(form)}?${params.toString()}`,
    );
  },

  themes(): Promise<MindmapThemeSummary[]> {
    return request<MindmapThemeSummary[]>('/mindmap/themes');
  },

  theme(slug: string): Promise<MindmapThemeSummary & { graph: MindmapGraph }> {
    return request<MindmapThemeSummary & { graph: MindmapGraph }>(
      `/mindmap/themes/${encodeURIComponent(slug)}`,
    );
  },
};
