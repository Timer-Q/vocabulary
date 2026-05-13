import Taro from '@tarojs/taro';
import type { ReactElement} from 'react';
import { useCallback, useRef } from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { BaseEventOrig, ITouchEvent } from '@tarojs/components/types/common';
import { MVP_ROOT_ID_TO_FORM } from '@/data/mvp';
import { ProgressRing } from '@/components/progress-ring';
import type { AnswerGrade } from '@/types/learning';
import type { WordDetail } from '@/services/api/types';
import './index.scss';

export interface WordCardProps {
  word: WordDetail;
  mastery: number;
  flipped: boolean;
  isFavorite: boolean;
  previewSentence: string | null;
  onToggleFlip: () => void;
  onGrade: (grade: AnswerGrade) => void;
  onOpenRoot: (form: string) => void;
  onToggleFavorite: () => void;
  onOpenDetail: () => void;
}

interface TouchRef {
  x: number;
  y: number;
  t: number;
}

const gradeLabels: { grade: AnswerGrade; label: string; tone: string }[] = [
  { grade: 'unknown', label: '陌生', tone: 'is-unknown' },
  { grade: 'vague', label: '模糊', tone: 'is-vague' },
  { grade: 'known', label: '认识', tone: 'is-known' },
  { grade: 'mastered', label: '熟练', tone: 'is-mastered' },
];

export function WordCard(props: WordCardProps): ReactElement {
  const {
    word,
    mastery,
    flipped,
    isFavorite,
    previewSentence,
    onToggleFlip,
    onGrade,
    onOpenRoot,
    onToggleFavorite,
    onOpenDetail,
  } = props;

  const touchRef = useRef<TouchRef | null>(null);
  const primaryMeaning = word.pos[0]?.meaning ?? '查看详情';

  const playAudio = useCallback(
    (url: string | null | undefined, label: string) => {
      if (!url) {
        Taro.showToast({ title: '音频准备中', icon: 'none' });
        return;
      }
      const ctx = Taro.createInnerAudioContext();
      ctx.src = url;
      ctx.onError(() => {
        Taro.showToast({ title: `${label}播放失败`, icon: 'none' });
        ctx.destroy();
      });
      ctx.onEnded(() => ctx.destroy());
      ctx.play();
    },
    [],
  );

  const onTouchStart = (e: BaseEventOrig): void => {
    if (!('touches' in e)) {
      return;
    }
    const te = e as ITouchEvent;
    const t = te.touches?.[0];
    if (!t) {
      return;
    }
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const onTouchEnd = (e: BaseEventOrig): void => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!('changedTouches' in e) || !start) {
      return;
    }
    const te = e as ITouchEvent;
    const t = te.changedTouches?.[0];
    if (!t) {
      return;
    }
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    if (dt > 800) {
      return;
    }
    if (Math.abs(dx) > 56 && Math.abs(dy) < 80) {
      if (dx < 0) {
        onGrade('unknown');
      } else {
        onGrade('mastered');
      }
      return;
    }
    if (dy < -72 && Math.abs(dx) < 56) {
      const rootSeg = word.splitPattern.find((s) => s.type === 'root');
      const form =
        (rootSeg?.rootId && MVP_ROOT_ID_TO_FORM[rootSeg.rootId]) ||
        (rootSeg?.type === 'root' ? rootSeg.form.replace(/^-+|-+$/g, '') : null);
      if (form) {
        onOpenRoot(form);
      } else {
        Taro.showToast({ title: '暂无词根页', icon: 'none' });
      }
    }
    if (dy > 72 && Math.abs(dx) < 56) {
      onToggleFavorite();
    }
  };

  const onSegmentTap = (segment: (typeof word.splitPattern)[0]): void => {
    if (segment.type !== 'root') {
      return;
    }
    const form =
      (segment.rootId && MVP_ROOT_ID_TO_FORM[segment.rootId]) ||
      segment.form.replace(/^-+|-+$/g, '');
    if (form) {
      onOpenRoot(form);
    }
  };

  const cover = word.media[0];

  return (
    <View className="word-card" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <View className="word-card__top">
        <ProgressRing mastery={mastery} />
        <View className="word-card__top-actions">
          <Text className="word-card__fav" onClick={onToggleFavorite}>
            {isFavorite ? '♥' : '♡'}
          </Text>
          <Text className="word-card__ghost-btn" onClick={() => onToggleFlip()}>
            {flipped ? '正面' : '例句'}
          </Text>
          <Text className="word-card__ghost-btn" onClick={onOpenDetail}>
            详情
          </Text>
        </View>
      </View>

      {!flipped ? (
        <>
          <View className="word-card__header">
            <Text className="word-card__spelling">{word.spelling}</Text>
            <Text className="word-card__phonetic">{word.phoneticUk ?? word.phoneticUs ?? ''}</Text>
            <View className="word-card__speak-row">
              <Text className="word-card__mini-btn" onClick={() => playAudio(word.audioUkUrl, '英音')}>
                英音
              </Text>
              <Text className="word-card__mini-btn" onClick={() => playAudio(word.audioUsUrl, '美音')}>
                美音
              </Text>
            </View>
          </View>

          {cover ? (
            <Image className="word-card__cover" src={cover.thumbUrl ?? cover.url} mode="aspectFill" />
          ) : (
            <View className="word-card__cover word-card__cover--placeholder">
              <Text className="word-card__cover-text">场景配图准备中</Text>
            </View>
          )}

          <Text className="word-card__meaning">{primaryMeaning}</Text>

          <View className="word-card__segments">
            {word.splitPattern.map((segment, idx) => (
              <View
                key={`${segment.type}-${segment.form}-${idx}`}
                className={`word-card__segment is-${segment.type}`}
                onClick={() => onSegmentTap(segment)}
              >
                <Text className="word-card__segment-form">{segment.form}</Text>
                <Text className="word-card__segment-meaning">{segment.meaning}</Text>
              </View>
            ))}
          </View>

          <Text className="word-card__hint">左滑陌生 · 右滑熟练 · 上滑词根 · 下滑收藏</Text>
        </>
      ) : (
        <View className="word-card__back">
          <Text className="word-card__back-title">例句预览</Text>
          <Text className="word-card__back-sentence">{previewSentence ?? '今日例句在下方列表'}</Text>
          <Text className="word-card__ghost-btn word-card__back-link" onClick={onOpenDetail}>
            查看单词详情
          </Text>
        </View>
      )}

      <View className="word-card__actions">
        {gradeLabels.map((g) => (
          <Text key={g.grade} className={`word-card__pill ${g.tone}`} onClick={() => onGrade(g.grade)}>
            {g.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
