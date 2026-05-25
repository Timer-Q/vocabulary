import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { BaseEventOrig, ITouchEvent } from '@tarojs/components/types/common';
import { HOVER_PRESS, HOVER_PRESS_LIGHT, HOVER_STAY_MS } from '@/constants/interaction';
import { resolveRootForm } from '@/utils/root-form';
import { ProgressRing } from '@/components/progress-ring';
import type { AnswerGrade } from '@/types/learning';
import type { WordDetail } from '@/services/api/types';
import { playAudioUrl } from '@/utils/play-audio';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '@/utils/haptic';
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

type SwipeHint = 'left' | 'right' | 'up' | 'down' | null;
type FlashTone = 'bad' | 'warn' | 'good' | 'great' | null;

const gradeLabels: { grade: AnswerGrade; label: string; tone: string }[] = [
  { grade: 'unknown', label: '陌生', tone: 'is-unknown' },
  { grade: 'vague', label: '模糊', tone: 'is-vague' },
  { grade: 'known', label: '认识', tone: 'is-known' },
  { grade: 'mastered', label: '熟练', tone: 'is-mastered' },
];

function flashToneForGrade(grade: AnswerGrade): FlashTone {
  if (grade === 'unknown') {
    return 'bad';
  }
  if (grade === 'vague') {
    return 'warn';
  }
  if (grade === 'mastered') {
    return 'great';
  }
  return 'good';
}

function hapticForGrade(grade: AnswerGrade): void {
  if (grade === 'mastered') {
    hapticSuccess();
    return;
  }
  if (grade === 'unknown' || grade === 'vague') {
    hapticWarning();
    return;
  }
  hapticLight();
}

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
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [swipeHint, setSwipeHint] = useState<SwipeHint>(null);
  const [flashTone, setFlashTone] = useState<FlashTone>(null);
  const [poppingGrade, setPoppingGrade] = useState<AnswerGrade | null>(null);
  const [enterKey, setEnterKey] = useState(0);

  const primaryMeaning = word.pos[0]?.meaning ?? '查看详情';

  useEffect(() => {
    setEnterKey((k) => k + 1);
    setSwipeHint(null);
    setFlashTone(null);
    setPoppingGrade(null);
  }, [word.spelling]);

  useEffect(
    () => () => {
      if (popTimerRef.current) {
        clearTimeout(popTimerRef.current);
      }
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    },
    [],
  );

  const triggerFeedback = (grade: AnswerGrade): void => {
    hapticForGrade(grade);
    setFlashTone(flashToneForGrade(grade));
    setPoppingGrade(grade);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    if (popTimerRef.current) {
      clearTimeout(popTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => setFlashTone(null), 520);
    popTimerRef.current = setTimeout(() => setPoppingGrade(null), 420);
  };

  const commitGrade = (grade: AnswerGrade): void => {
    triggerFeedback(grade);
    setSwipeHint(null);
    onGrade(grade);
  };

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
    setSwipeHint(null);
  };

  const onTouchMove = (e: BaseEventOrig): void => {
    const start = touchRef.current;
    if (!start || !('touches' in e)) {
      return;
    }
    const te = e as ITouchEvent;
    const t = te.touches?.[0];
    if (!t) {
      return;
    }
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const threshold = 28;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      setSwipeHint(dx < 0 ? 'left' : 'right');
      return;
    }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
      setSwipeHint(dy < 0 ? 'up' : 'down');
      return;
    }
    setSwipeHint(null);
  };

  const onTouchEnd = (e: BaseEventOrig): void => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!('changedTouches' in e) || !start) {
      setSwipeHint(null);
      return;
    }
    const te = e as ITouchEvent;
    const t = te.changedTouches?.[0];
    if (!t) {
      setSwipeHint(null);
      return;
    }
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    if (dt > 800) {
      setSwipeHint(null);
      return;
    }
    if (Math.abs(dx) > 56 && Math.abs(dy) < 80) {
      if (dx < 0) {
        commitGrade('unknown');
      } else {
        commitGrade('mastered');
      }
      return;
    }
    if (dy < -72 && Math.abs(dx) < 56) {
      const rootSeg = word.splitPattern.find((s) => s.type === 'root');
      const form = rootSeg ? resolveRootForm(rootSeg) : null;
      if (form) {
        hapticMedium();
        onOpenRoot(form);
      } else {
        Taro.showToast({ title: '暂无词根页', icon: 'none' });
      }
      setSwipeHint(null);
      return;
    }
    if (dy > 72 && Math.abs(dx) < 56) {
      hapticLight();
      onToggleFavorite();
      setSwipeHint(null);
      return;
    }
    setSwipeHint(null);
  };

  const onSegmentTap = (segment: (typeof word.splitPattern)[0]): void => {
    if (segment.type !== 'root') {
      return;
    }
    const form = resolveRootForm(segment);
    if (form) {
      hapticLight();
      onOpenRoot(form);
    }
  };

  const cover = word.media[0];

  return (
    <View
      key={`card-${word.spelling}-${enterKey}`}
      className={`word-card ui-animate-in ${flashTone ? `is-flash-${flashTone}` : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchRef.current = null;
        setSwipeHint(null);
      }}
    >
      {flashTone ? <View className={`word-card__flash word-card__flash--${flashTone} ui-animate-flash`} /> : null}

      {swipeHint === 'left' ? (
        <View className="word-card__hint-overlay word-card__hint-overlay--left">
          <Text className="word-card__hint-overlay-text">陌生</Text>
        </View>
      ) : null}
      {swipeHint === 'right' ? (
        <View className="word-card__hint-overlay word-card__hint-overlay--right">
          <Text className="word-card__hint-overlay-text">熟练</Text>
        </View>
      ) : null}
      {swipeHint === 'up' ? (
        <View className="word-card__hint-overlay word-card__hint-overlay--up">
          <Text className="word-card__hint-overlay-text">词根</Text>
        </View>
      ) : null}
      {swipeHint === 'down' ? (
        <View className="word-card__hint-overlay word-card__hint-overlay--down">
          <Text className="word-card__hint-overlay-text">{isFavorite ? '已收藏' : '收藏'}</Text>
        </View>
      ) : null}

      <View className="word-card__top">
        <ProgressRing mastery={mastery} />
        <View className="word-card__top-actions">
          <Text
            className={`word-card__fav ${isFavorite ? 'is-on' : ''}`}
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticLight();
              onToggleFavorite();
            }}
          >
            {isFavorite ? '♥' : '♡'}
          </Text>
          <Text
            className="word-card__ghost-btn"
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticLight();
              onToggleFlip();
            }}
          >
            {flipped ? '正面' : '例句'}
          </Text>
          <Text
            className="word-card__ghost-btn"
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticLight();
              onOpenDetail();
            }}
          >
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
              <Text
                className="word-card__mini-btn"
                hoverClass={HOVER_PRESS_LIGHT}
                hoverStayTime={HOVER_STAY_MS}
                onClick={() => {
                  hapticLight();
                  playAudioUrl(word.audioUkUrl, '英音');
                }}
              >
                英音
              </Text>
              <Text
                className="word-card__mini-btn"
                hoverClass={HOVER_PRESS_LIGHT}
                hoverStayTime={HOVER_STAY_MS}
                onClick={() => {
                  hapticLight();
                  playAudioUrl(word.audioUsUrl, '美音');
                }}
              >
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
                hoverClass={segment.type === 'root' ? HOVER_PRESS : HOVER_PRESS_LIGHT}
                hoverStayTime={HOVER_STAY_MS}
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
          <Text
            className="word-card__ghost-btn word-card__back-link"
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={onOpenDetail}
          >
            查看单词详情
          </Text>
        </View>
      )}

      <View className="word-card__actions">
        {gradeLabels.map((g) => (
          <Text
            key={g.grade}
            className={`word-card__pill ${g.tone} ${poppingGrade === g.grade ? 'is-popping' : ''}`}
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => commitGrade(g.grade)}
          >
            {g.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
