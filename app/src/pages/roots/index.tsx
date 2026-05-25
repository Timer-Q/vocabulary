import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Text, View } from '@tarojs/components';
import { HOVER_PRESS, HOVER_PRESS_LIGHT, HOVER_STAY_MS } from '@/constants/interaction';
import { hapticLight } from '@/utils/haptic';
import { MORPHEME_KIND_LABELS, ORIGIN_LABELS } from '@/data/morpheme-catalog';
import { useTabSelected } from '@/hooks/use-tab-selected';
import { api } from '@/services/api';
import type { MorphemeKind, RootListItem, RootOriginKey } from '@/types/roots';
import { buildMvpRootList, filterMorphemeItems, mergeWithMorphemeCatalog } from '@/utils/roots-list';
import './index.scss';

const KIND_FILTERS: { key: MorphemeKind | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'root', label: '词根' },
  { key: 'prefix', label: '前缀' },
  { key: 'suffix', label: '后缀' },
  { key: 'combining_form', label: '连结' },
];

const ORIGIN_FILTERS: { key: RootOriginKey | 'all'; label: string }[] = [
  { key: 'all', label: '全部语源' },
  ...Object.entries(ORIGIN_LABELS).map(([key, label]) => ({
    key: key as RootOriginKey,
    label,
  })),
];

export default function RootsPage(): ReactElement {
  useTabSelected(1);

  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<RootOriginKey | 'all'>('all');
  const [kind, setKind] = useState<MorphemeKind | 'all'>('all');
  const [items, setItems] = useState<RootListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const loadRoots = useCallback(async (
    q: string,
    originKey: RootOriginKey | 'all',
    kindKey: MorphemeKind | 'all',
  ) => {
    setLoading(true);
    const originParam = originKey === 'all' ? undefined : originKey;
    const kindParam = kindKey === 'all' ? undefined : kindKey;
    try {
      const data = await api.roots.list(q, originParam, kindParam);
      const filtered = filterMorphemeItems(
        mergeWithMorphemeCatalog(data.items),
        q,
        originParam,
        kindParam,
      );
      setItems(filtered);
      setFromCache(false);
    } catch {
      const fallback = buildMvpRootList(q, originParam, kindParam);
      setItems(fallback.items);
      setFromCache(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRoots(query, origin, kind);
    }, 280);
    return () => clearTimeout(timer);
  }, [query, origin, kind, loadRoots]);

  const totalLabel = useMemo(() => {
    if (loading) {
      return '加载中…';
    }
    return `${items.length} 个词素`;
  }, [items.length, loading]);

  const openDetail = (item: RootListItem): void => {
    hapticLight();
    const kindQs = `&kind=${encodeURIComponent(item.kind)}`;
    Taro.navigateTo({
      url: `/pages/root-detail/index?form=${encodeURIComponent(item.form)}${kindQs}`,
    });
  };

  const openMindmap = (item: RootListItem): void => {
    hapticLight();
    const kindQs = `&kind=${encodeURIComponent(item.kind)}`;
    Taro.navigateTo({
      url: `/pages/mindmap/index?form=${encodeURIComponent(item.form)}${kindQs}`,
    });
  };

  return (
    <View className="page roots-page">
      <View className="roots-hero">
        <Text className="roots-hero__title">词根与词缀网络</Text>
        <Text className="roots-hero__sub">从词根、前缀、后缀一次性建立拆词地图</Text>
        {fromCache ? <Text className="roots-hero__badge">离线预览</Text> : null}
      </View>

      <View className="roots-search">
        <Text className="roots-search__icon">⌕</Text>
        <Input
          className="roots-search__input"
          type="text"
          placeholder="搜索词根、词缀或含义"
          placeholderClass="roots-search__placeholder"
          value={query}
          onInput={(e) => setQuery(e.detail.value)}
        />
      </View>

      <View className="roots-filters roots-filters--kind">
        {KIND_FILTERS.map((filter) => (
          <Text
            key={filter.key}
            className={`roots-filters__chip ${kind === filter.key ? 'is-active' : ''}`}
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticLight();
              setKind(filter.key);
            }}
          >
            {filter.label}
          </Text>
        ))}
      </View>

      <View className="roots-filters">
        {ORIGIN_FILTERS.map((filter) => (
          <Text
            key={filter.key}
            className={`roots-filters__chip ${origin === filter.key ? 'is-active' : ''}`}
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticLight();
              setOrigin(filter.key);
            }}
          >
            {filter.label}
          </Text>
        ))}
      </View>

      <Text className="roots-meta">{totalLabel}</Text>

      <View className="roots-grid ui-stagger">
        {items.map((item) => (
          <View
            key={item.id}
            className="roots-card"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => openDetail(item)}
          >
            <View className="roots-card__head">
              <Text className="roots-card__form">{item.form}</Text>
              <Text className="roots-card__count">
                {MORPHEME_KIND_LABELS[item.kind]} · {item.level === 'advanced' ? '进阶' : '核心'}
              </Text>
            </View>
            <Text className="roots-card__origin">{item.originLabel}</Text>
            <Text className="roots-card__meaning">{item.meaning}</Text>
            {item.extendedMeaning ? (
              <Text className="roots-card__ext">{item.extendedMeaning}</Text>
            ) : null}
            <View
              className="roots-card__map"
              hoverClass={HOVER_PRESS_LIGHT}
              hoverStayTime={HOVER_STAY_MS}
              onClick={(e) => {
                e.stopPropagation();
                openMindmap(item);
              }}
            >
              <Text>词素详情 / 导图 →</Text>
            </View>
          </View>
        ))}
      </View>

      {!loading && items.length === 0 ? (
        <Text className="roots-empty">没有匹配的词素，换个关键词试试</Text>
      ) : null}
    </View>
  );
}
