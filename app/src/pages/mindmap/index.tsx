import Taro, { useLoad } from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { MindmapGraphView } from '@/components/mindmap-graph';
import { MORPHEME_KIND_LABELS } from '@/data/morpheme-catalog';
import { api } from '@/services/api';
import type { MindmapDimension, MindmapGraph } from '@/types/mindmap';
import { MINDMAP_DIMENSION_LABELS } from '@/types/mindmap';
import type { MorphemeKind } from '@/types/roots';
import { buildMvpMindmap, hasCatalogMorpheme } from '@/utils/mvp-mindmap';
import './index.scss';

const DIMENSIONS: MindmapDimension[] = ['mixed', 'derivatives', 'synonyms', 'families'];

async function fetchMindmapGraph(
  form: string,
  rootId: string,
  dim: MindmapDimension,
  kind?: MorphemeKind,
): Promise<MindmapGraph> {
  if (form) {
    try {
      return await api.mindmap.byForm(form, dim, 2, kind);
    } catch {
      /* 按 form 失败时再尝试 id */
    }
  }
  if (rootId) {
    return api.mindmap.byRoot(rootId, dim, 2);
  }
  throw new Error('missing_root_ref');
}

export default function MindmapPage(): ReactElement {
  const [rootId, setRootId] = useState('');
  const [rootForm, setRootForm] = useState('');
  const [morphemeKind, setMorphemeKind] = useState<MorphemeKind | undefined>(undefined);
  const [dimension, setDimension] = useState<MindmapDimension>('mixed');
  const [graph, setGraph] = useState<MindmapGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  const loadGraph = useCallback(
    async (
      form: string,
      id: string,
      dim: MindmapDimension,
      kind?: MorphemeKind,
    ): Promise<void> => {
      setLoading(true);
      setUsedFallback(false);
      try {
        const data = await fetchMindmapGraph(form, id, dim, kind);
        setGraph(data);
        if (data.rootId) {
          setRootId(data.rootId);
        }
        if (data.morphemeKind) {
          setMorphemeKind(data.morphemeKind);
        }
      } catch (err) {
        console.warn('[mindmap] API failed, using offline catalog fallback', err);
        const fallback = form ? buildMvpMindmap(form, dim, kind) : null;
        if (fallback) {
          setGraph(fallback);
          setUsedFallback(true);
          if (fallback.morphemeKind) {
            setMorphemeKind(fallback.morphemeKind);
          }
        } else if (form && !hasCatalogMorpheme(form, kind)) {
          setGraph(null);
          Taro.showToast({ title: '该词素暂无导图', icon: 'none' });
        } else {
          setGraph(null);
          Taro.showToast({ title: '导图加载失败', icon: 'none' });
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useLoad((query) => {
    const id = typeof query.rootId === 'string' ? query.rootId : '';
    const form = typeof query.form === 'string' ? query.form.toLowerCase() : '';
    const kindRaw = query.kind;
    const kind =
      kindRaw === 'root' ||
      kindRaw === 'prefix' ||
      kindRaw === 'suffix' ||
      kindRaw === 'combining_form'
        ? kindRaw
        : undefined;
    setRootId(id);
    setRootForm(form);
    setMorphemeKind(kind);
    if (form || id) {
      void loadGraph(form, id, 'mixed', kind);
    } else {
      setLoading(false);
    }
  });

  const switchDimension = (dim: MindmapDimension): void => {
    setDimension(dim);
    if (rootForm || rootId) {
      void loadGraph(rootForm, rootId, dim, morphemeKind);
    }
  };

  const kindLabel = morphemeKind ? MORPHEME_KIND_LABELS[morphemeKind] : '词素';
  const showFamiliesTab = morphemeKind === 'root' || morphemeKind === undefined;

  return (
    <View className="page page--no-tab mindmap-page">
      <Text className="mindmap-page__title">
        {rootForm ? `${rootForm} · ${kindLabel}知识网` : '词素思维导图'}
      </Text>
      <Text className="mindmap-page__sub">
        {usedFallback ? '当前为离线示意导图（游客模式或后端未连接）' : '点击节点查看单词或词素详情'}
      </Text>

      <View className="mindmap-page__tabs">
        {DIMENSIONS.filter((dim) => showFamiliesTab || dim !== 'families').map((dim) => (
          <Text
            key={dim}
            className={`mindmap-page__tab ${dimension === dim ? 'is-active' : ''}`}
            onClick={() => switchDimension(dim)}
          >
            {MINDMAP_DIMENSION_LABELS[dim]}
          </Text>
        ))}
      </View>

      {loading ? (
        <Text className="mindmap-page__loading">加载中…</Text>
      ) : graph ? (
        <MindmapGraphView graph={graph} />
      ) : (
        <Text className="mindmap-page__loading">暂无导图数据</Text>
      )}
    </View>
  );
}
