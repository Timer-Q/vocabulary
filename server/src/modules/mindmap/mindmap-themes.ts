import type { MindmapThemeSummary } from './mindmap.types';

/** CET 高频词根主题包（与 PRD / MVP 任务卡方向一致） */
export const MINDMAP_THEMES: Omit<MindmapThemeSummary, 'rootId'>[] = [
  {
    slug: 'struct-build',
    title: '建造 struct',
    description: '重建、结构、建造与破坏 — 工程与抽象建构',
    rootForm: 'struct',
  },
  {
    slug: 'dict-say',
    title: '言说 dict',
    description: '字典、预测、反驳 — 与「说」相关的词族',
    rootForm: 'dict',
  },
  {
    slug: 'port-carry',
    title: '携带 port',
    description: '运输、出口、机会 — 与「携带」相关的词族',
    rootForm: 'port',
  },
];
