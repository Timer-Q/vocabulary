import { buildCatalogDerivativeSamples, findCatalogMorpheme } from '@/utils/morpheme-derivatives';
import type { MindmapDimension, MindmapGraph, MindmapNode } from '@/types/mindmap';
import type { MorphemeKind } from '@/types/roots';

const OFFLINE_DERIVATIVE_LIMIT = 12;

/** 离线 / API 失败时，用全量词素目录生成简易导图 */
export function buildMvpMindmap(
  form: string,
  dimension: MindmapDimension,
  kind?: MorphemeKind,
): MindmapGraph | null {
  const morpheme = findCatalogMorpheme(form, kind);
  if (!morpheme) {
    return null;
  }

  const centerNodeId = `m_catalog_${morpheme.kind}_${morpheme.form.replace(/[^a-z]/gi, '')}`;
  const nodes: MindmapNode[] = [
    {
      id: centerNodeId,
      type: morpheme.kind === 'root' ? 'root' : 'morpheme',
      label: morpheme.form,
      meaning: morpheme.meaning,
    },
  ];
  const edges: MindmapGraph['edges'] = [];

  if (dimension === 'derivatives' || dimension === 'mixed') {
    const samples = buildCatalogDerivativeSamples(morpheme).slice(0, OFFLINE_DERIVATIVE_LIMIT);
    for (const d of samples) {
      const wordId = `w_catalog_${d.spelling}`;
      nodes.push({
        id: wordId,
        type: 'word',
        label: d.spelling,
        spelling: d.spelling,
      });
      edges.push({ from: centerNodeId, to: wordId, relation: 'derives' });
    }
  }

  return {
    rootId: morpheme.id,
    centerNodeId,
    morphemeKind: morpheme.kind,
    dimension,
    depth: 2,
    nodes,
    edges,
  };
}

export function hasCatalogMorpheme(form: string, kind?: MorphemeKind): boolean {
  return Boolean(findCatalogMorpheme(form, kind));
}
