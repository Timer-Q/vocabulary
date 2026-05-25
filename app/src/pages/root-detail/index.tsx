import Taro, { useLoad } from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Text, View } from '@tarojs/components';
import { ExampleList } from '@/components/example-list';
import { MORPHEME_KIND_LABELS } from '@/data/morpheme-catalog';
import { MVP_MORPHEME_LIBRARY, MVP_ROOT_LIBRARY } from '@/data/mvp';
import { api } from '@/services/api';
import type { RootDerivative, RootDetailData } from '@/types/learning';
import type { MorphemeKind } from '@/types/roots';
import { catalogToRootDetail, remoteToRootDetail } from '@/utils/root-detail';
import './index.scss';

function resolveMvpDetail(form: string, kind?: MorphemeKind): RootDetailData | null {
  if (kind) {
    const fromAffix = MVP_MORPHEME_LIBRARY[form];
    if (fromAffix && fromAffix.kind === kind) {
      return fromAffix;
    }
    const fromRoot = MVP_ROOT_LIBRARY[form];
    if (fromRoot && fromRoot.kind === kind) {
      return fromRoot;
    }
    return catalogToRootDetail(form, kind);
  }
  return (
    MVP_ROOT_LIBRARY[form] ??
    MVP_MORPHEME_LIBRARY[form] ??
    catalogToRootDetail(form)
  );
}

export default function RootDetailPage(): ReactElement {
  const [root, setRoot] = useState<RootDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useLoad((query) => {
    const raw = query.form;
    const form = typeof raw === 'string' ? raw.toLowerCase() : '';
    const kindRaw = query.kind;
    const kind =
      kindRaw === 'root' ||
      kindRaw === 'prefix' ||
      kindRaw === 'suffix' ||
      kindRaw === 'combining_form'
        ? kindRaw
        : undefined;

    if (!form) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const remote = await api.roots.detail(form, kind);
        setRoot(remoteToRootDetail(remote));
      } catch {
        setRoot(resolveMvpDetail(form, kind));
      } finally {
        setLoading(false);
      }
    })();
  });

  const openWord = (spelling: string): void => {
    Taro.navigateTo({ url: `/pages/word-detail/index?spelling=${encodeURIComponent(spelling)}` });
  };

  const openDerivative = (derivative: RootDerivative): void => {
    if (derivative.isPreview) {
      Taro.showToast({ title: '单词详情待补充', icon: 'none' });
      return;
    }
    openWord(derivative.spelling);
  };

  const openMindmap = (): void => {
    if (!root) {
      return;
    }
    const kindQs = `&kind=${encodeURIComponent(root.kind)}`;
    Taro.navigateTo({
      url: `/pages/mindmap/index?rootId=${encodeURIComponent(root.id)}&form=${encodeURIComponent(root.form)}${kindQs}`,
    });
  };

  if (loading) {
    return (
      <View className="page page--no-tab root-detail">
        <Text className="root-detail__empty">加载中…</Text>
      </View>
    );
  }

  if (!root) {
    return (
      <View className="page page--no-tab root-detail">
        <Text className="root-detail__empty">未找到该词素</Text>
      </View>
    );
  }

  const kindLabel = MORPHEME_KIND_LABELS[root.kind];
  const examplesTitle = root.kind === 'root' ? '词根级例句' : '关联例句';

  return (
    <View className="page page--no-tab root-detail">
      <View className="root-detail__hero">
        <Text className="root-detail__form">{root.form}</Text>
        <View className="root-detail__meta">
          <Text className="root-detail__pill">{root.originLabel}</Text>
          <Text className="root-detail__pill root-detail__pill--kind">{kindLabel}</Text>
          <Text className="root-detail__mindmap-btn" onClick={openMindmap}>
            思维导图
          </Text>
        </View>
        <Text className="root-detail__mean">{root.meaning}</Text>
      </View>

      {root.extendedMeaning ? (
        <Text className="root-detail__ext">{root.extendedMeaning}</Text>
      ) : null}
      {root.story ? <Text className="root-detail__story">{root.story}</Text> : null}

      <Text className="root-detail__h">派生词 · {root.derivatives.length}</Text>
      <View className="root-detail__deriv">
        {root.derivatives.length > 0 ? (
          root.derivatives.map((d) => (
            <Text
              key={d.spelling}
              className={`root-detail__chip${d.isPreview ? ' root-detail__chip--preview' : ''}`}
              onClick={() => openDerivative(d)}
            >
              {d.spelling}
              <Text className="root-detail__chip-gloss"> {d.gloss}</Text>
            </Text>
          ))
        ) : (
          <Text className="root-detail__empty-inline">暂无关联派生词，请连接后端并执行数据种子</Text>
        )}
      </View>

      <Text className="root-detail__h">{examplesTitle}</Text>
      {root.examples.length > 0 ? (
        <ExampleList examples={root.examples} />
      ) : (
        <Text className="root-detail__empty-inline">暂无例句</Text>
      )}
    </View>
  );
}
