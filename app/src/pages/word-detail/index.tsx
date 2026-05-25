import Taro, { useLoad } from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import { ExampleList } from '@/components/example-list';
import { ProgressRing } from '@/components/progress-ring';
import { useLearningStore } from '@/store/learning';
import type { LearningCardBundle } from '@/types/learning';
import { playAudioUrl } from '@/utils/play-audio';
import { resolveRootForm } from '@/utils/root-form';
import { formatLevelTag } from '@/utils/word-level-label';
import './index.scss';

function parseSpellingQuery(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') {
    return raw[0];
  }
  return '';
}

function hasWordStats(word: LearningCardBundle['word']): boolean {
  return (
    word.level.length > 0 || word.frequency !== null || word.difficulty !== null
  );
}

export default function WordDetailPage(): ReactElement {
  const [bundle, setBundle] = useState<LearningCardBundle | null | undefined>(undefined);
  const loadWordDetail = useLearningStore((s) => s.loadWordDetail);
  const wordMastery = useLearningStore((s) => s.wordMastery);

  useLoad((query) => {
    const spelling = parseSpellingQuery(query.spelling);
    void loadWordDetail(spelling).then((b) => setBundle(b ?? null));
  });

  const openRoot = (form: string): void => {
    Taro.navigateTo({ url: `/pages/root-detail/index?form=${encodeURIComponent(form)}` });
  };

  if (bundle === undefined) {
    return (
      <View className="page page--no-tab word-detail">
        <Text className="word-detail__loading">加载中…</Text>
      </View>
    );
  }

  if (bundle === null) {
    return (
      <View className="page page--no-tab word-detail">
        <Text className="word-detail__empty">未找到该词（可稍后接入全量词库）</Text>
      </View>
    );
  }

  const { word, examples } = bundle;
  const mastery = wordMastery[word.id] ?? 1;
  const cover = word.media[0];
  const primaryPos = word.pos[0];
  const hasSplit = word.splitPattern.length > 0;

  return (
    <View className="page page--no-tab word-detail">
      <View className="word-detail__hero">
        <View className="word-detail__head">
          <View className="word-detail__head-main">
            <Text className="word-detail__spell">{word.spelling}</Text>
            {word.phoneticUk ? (
              <Text className="word-detail__phone">英 {word.phoneticUk}</Text>
            ) : null}
            {word.phoneticUs ? (
              <Text className="word-detail__phone">美 {word.phoneticUs}</Text>
            ) : null}
            {!word.phoneticUk && !word.phoneticUs ? (
              <Text className="word-detail__phone word-detail__phone--muted">音标待补充</Text>
            ) : null}
            <View className="word-detail__speak-row">
              <Text
                className="word-detail__speak-btn"
                onClick={() => playAudioUrl(word.audioUkUrl, '英音')}
              >
                英音
              </Text>
              <Text
                className="word-detail__speak-btn"
                onClick={() => playAudioUrl(word.audioUsUrl, '美音')}
              >
                美音
              </Text>
              <Text
                className="word-detail__speak-btn"
                onClick={() => playAudioUrl(word.audioSlowUrl, '慢速')}
              >
                慢速
              </Text>
            </View>
            {primaryPos ? (
              <Text className="word-detail__gloss">
                {primaryPos.pos}. {primaryPos.meaning}
              </Text>
            ) : (
              <Text className="word-detail__gloss word-detail__gloss--muted">释义待补充</Text>
            )}
          </View>
          <ProgressRing mastery={mastery} />
        </View>

        {hasWordStats(word) ? (
          <View className="word-detail__stats">
            {word.level.map((tag) => (
              <Text key={tag} className="word-detail__stat-chip">
                {formatLevelTag(tag)}
              </Text>
            ))}
            {word.frequency !== null ? (
              <Text className="word-detail__stat-chip">词频 {word.frequency}</Text>
            ) : null}
            {word.difficulty !== null ? (
              <Text className="word-detail__stat-chip">难度 {word.difficulty}/5</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {cover ? (
        <Image className="word-detail__cover" src={cover.thumbUrl ?? cover.url} mode="aspectFill" />
      ) : (
        <View className="word-detail__cover word-detail__cover--ph">
          <Text className="word-detail__ph-text">场景配图准备中</Text>
        </View>
      )}

      {word.scenes.length > 0 ? (
        <>
          <Text className="word-detail__section-title">应用场景</Text>
          <View className="word-detail__scenes">
            {word.scenes.map((scene) => (
              <View key={scene.title} className="word-detail__scene-card">
                <Text className="word-detail__scene-title">{scene.title}</Text>
                {scene.description ? (
                  <Text className="word-detail__scene-desc">{scene.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text className="word-detail__section-title">词根拆解</Text>
      {hasSplit ? (
        <View className="word-detail__segments">
          {word.splitPattern.map((seg, idx) => {
            const rootForm = seg.type === 'root' ? resolveRootForm(seg) : null;
            return (
              <View
                key={`${seg.form}-${idx}`}
                className={`word-detail__seg is-${seg.type}`}
                onClick={() => {
                  if (rootForm) {
                    openRoot(rootForm);
                  }
                }}
              >
                <Text className="word-detail__seg-form">{seg.form}</Text>
                <Text className="word-detail__seg-mean">{seg.meaning}</Text>
                {rootForm ? <Text className="word-detail__seg-tip">词根 · {rootForm}</Text> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View className="word-detail__empty-block">
          <Text className="word-detail__empty-block-text">词根拆解待补充，稍后接入全量词素库</Text>
        </View>
      )}

      {word.pos.length > 1 ? (
        <View className="word-detail__pos">
          {word.pos.map((p) => (
            <View key={`${p.pos}-${p.meaning}`} className="word-detail__pos-row">
              <Text className="word-detail__pos-tag">{p.pos}</Text>
              <Text className="word-detail__pos-mean">{p.meaning}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text className="word-detail__section-title">分层例句</Text>
      <ExampleList examples={examples} />
    </View>
  );
}
