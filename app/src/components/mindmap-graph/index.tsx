import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Text, View } from '@tarojs/components';
import type { MindmapEdgeRelation, MindmapGraph, MindmapNode } from '@/types/mindmap';
import './index.scss';

export interface MindmapGraphProps {
  graph: MindmapGraph;
  onNodeTap?: (node: MindmapNode) => void;
}

interface PlacedNode {
  node: MindmapNode;
  x: number;
  y: number;
}

const RELATION_LABELS: Record<MindmapEdgeRelation, string> = {
  derives: '派生',
  synonym: '近义',
  antonym: '反义',
  similar_form: '形近',
  cognate: '同源',
  similar_meaning: '义近',
  opposite: '相反',
};

function resolveCenterNodeId(graph: MindmapGraph): string {
  if (graph.centerNodeId) {
    return graph.centerNodeId;
  }
  const legacyRoot = graph.nodes.find((n) => n.type === 'root' && n.id === `r_${graph.rootId}`);
  if (legacyRoot) {
    return legacyRoot.id;
  }
  const morphemeCenter = graph.nodes.find(
    (n) => (n.type === 'root' || n.type === 'morpheme') && n.id === `m_${graph.rootId}`,
  );
  if (morphemeCenter) {
    return morphemeCenter.id;
  }
  return graph.nodes[0]?.id ?? '';
}

function placeNodes(graph: MindmapGraph): PlacedNode[] {
  const centerId = resolveCenterNodeId(graph);
  const center = graph.nodes.find((n) => n.id === centerId) ?? graph.nodes[0];
  if (!center) {
    return [];
  }

  const satellites = graph.nodes.filter((n) => n.id !== center.id);
  const radius = 240;
  const placed: PlacedNode[] = [{ node: center, x: 50, y: 50 }];

  satellites.forEach((node, index) => {
    const angle = (index / Math.max(satellites.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + Math.cos(angle) * (radius / 7.5);
    const y = 50 + Math.sin(angle) * (radius / 7.5);
    placed.push({ node, x, y });
  });

  return placed;
}

export function MindmapGraphView(props: MindmapGraphProps): ReactElement {
  const { graph, onNodeTap } = props;

  const placed = useMemo(() => placeNodes(graph), [graph]);
  const centerId = resolveCenterNodeId(graph);

  const handleTap = (node: MindmapNode): void => {
    if (onNodeTap) {
      onNodeTap(node);
      return;
    }
    if (node.type === 'word' && node.spelling) {
      Taro.navigateTo({
        url: `/pages/word-detail/index?spelling=${encodeURIComponent(node.spelling)}`,
      });
      return;
    }
    if (node.type === 'root' || node.type === 'morpheme') {
      const kind = graph.morphemeKind ?? (node.type === 'root' ? 'root' : undefined);
      const kindQs = kind ? `&kind=${encodeURIComponent(kind)}` : '';
      Taro.navigateTo({
        url: `/pages/root-detail/index?form=${encodeURIComponent(node.label)}${kindQs}`,
      });
    }
  };

  if (placed.length === 0) {
    return (
      <View className="mindmap-graph mindmap-graph--empty">
        <Text className="mindmap-graph__empty">暂无导图数据</Text>
      </View>
    );
  }

  const edgeHints = graph.edges.slice(0, 6);

  return (
    <View className="mindmap-graph">
      <View className="mindmap-graph__canvas">
        {placed.map(({ node, x, y }) => (
          <View
            key={node.id}
            className={`mindmap-graph__node is-${node.type} ${node.id === centerId ? 'is-center' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => handleTap(node)}
          >
            <Text className="mindmap-graph__node-label">{node.label}</Text>
            {node.meaning ? (
              <Text className="mindmap-graph__node-mean">{node.meaning}</Text>
            ) : null}
          </View>
        ))}
      </View>
      {edgeHints.length > 0 ? (
        <View className="mindmap-graph__legend">
          {edgeHints.map((edge) => (
            <Text key={`${edge.from}-${edge.to}-${edge.relation}`} className="mindmap-graph__legend-item">
              {RELATION_LABELS[edge.relation] ?? edge.relation}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
