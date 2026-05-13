import { useLoad } from '@tarojs/taro';
import type { ReactElement} from 'react';
import { useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import { ExampleList } from '@/components/example-list';
import { ProgressRing } from '@/components/progress-ring';
import { MVP_ROOT_ID_TO_FORM } from '@/data/mvp';
import { useLearningStore } from '@/store/learning';
import type { LearningCardBundle } from '@/types/learning';
import './index.scss';

export default function WordDetailPage(): ReactElement {
  const [bundle, setBundle] = useState<LearningCardBundle | null | undefined>(undefined);
  const loadWordDetail = useLearningStore((s) => s.loadWordDetail);
  const wordMastery = useLearningStore((s) => s.wordMastery);

  useLoad((query) => {
    const raw = query.spelling;
    const spelling = typeof raw === 'string' ? raw : '';
    void loadWordDetail(spelling).then((b) => setBundle(b ?? null));
  });

  if (bundle === undefined) {
    return (
      <View className="page word-detail">
        <Text className="word-detail__loading">加载中…</Text>
      </View>
    );
  }

  if (bundle === null) {
    return (
      <View className="page word-detail">
        <Text className="word-detail__empty">未找到该词（可稍后接入全量词库）</Text>
      </View>
    );
  }

  const { word, examples } = bundle;
  const mastery = wordMastery[word.id] ?? 1;
  const cover = word.media[0];

  return (
    <View className="page word-detail">
      <View className="word-detail__head">
        <View>
          <Text className="word-detail__spell">{word.spelling}</Text>
          <Text className="word-detail__phone">{word.phoneticUk ?? word.phoneticUs ?? ''}</Text>
        </View>
        <ProgressRing mastery={mastery} />
      </View>

      {cover ? (
        <Image className="word-detail__cover" src={cover.thumbUrl ?? cover.url} mode="aspectFill" />
      ) : (
        <View className="word-detail__cover word-detail__cover--ph">
          <Text className="word-detail__ph-text">场景配图准备中</Text>
        </View>
      )}

      <View className="word-detail__pos">
        {word.pos.map((p) => (
          <View key={`${p.pos}-${p.meaning}`} className="word-detail__pos-row">
            <Text className="word-detail__pos-tag">{p.pos}</Text>
            <Text className="word-detail__pos-mean">{p.meaning}</Text>
          </View>
        ))}
      </View>

      <View className="word-detail__segments">
        {word.splitPattern.map((seg, idx) => {
          const rootForm =
            seg.type === 'root'
              ? (seg.rootId && MVP_ROOT_ID_TO_FORM[seg.rootId]) || seg.form.replace(/^-+|-+$/g, '')
              : null;
          return (
            <View key={`${seg.form}-${idx}`} className={`word-detail__seg is-${seg.type}`}>
              <Text className="word-detail__seg-form">{seg.form}</Text>
              <Text className="word-detail__seg-mean">{seg.meaning}</Text>
              {rootForm ? <Text className="word-detail__seg-tip">词根 · {rootForm}</Text> : null}
            </View>
          );
        })}
      </View>

      <Text className="word-detail__section-title">分层例句</Text>
      <ExampleList examples={examples} />
    </View>
  );
}
