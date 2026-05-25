export type MindmapDimension = 'derivatives' | 'synonyms' | 'families' | 'mixed';

export type MindmapNodeType = 'root' | 'word' | 'morpheme';

export type MindmapEdgeRelation =
  | 'derives'
  | 'synonym'
  | 'antonym'
  | 'similar_form'
  | 'cognate'
  | 'similar_meaning'
  | 'opposite';

export interface MindmapNode {
  id: string;
  type: MindmapNodeType;
  label: string;
  meaning?: string;
  spelling?: string;
}

export interface MindmapEdge {
  from: string;
  to: string;
  relation: MindmapEdgeRelation;
}

export interface MindmapGraphPayload {
  rootId: string;
  centerNodeId: string;
  morphemeKind: 'root' | 'prefix' | 'suffix' | 'combining_form';
  dimension: MindmapDimension;
  depth: number;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export interface MindmapThemeSummary {
  slug: string;
  title: string;
  description: string;
  rootForm: string;
  rootId: string;
}
