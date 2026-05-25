import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { useEffect, useMemo } from 'react';
import { Button, Text, View } from '@tarojs/components';
import { HOVER_PRESS, HOVER_PRESS_LIGHT, HOVER_STAY_MS } from '@/constants/interaction';
import { ExampleList } from '@/components/example-list';
import { WordCard } from '@/components/word-card';
import { useTabSelected } from '@/hooks/use-tab-selected';
import { useLearningStore } from '@/store/learning';
import { hapticLight, hapticMedium, hapticSuccess } from '@/utils/haptic';
import './index.scss';

export default function LearnPage(): ReactElement {
  useTabSelected(2);

  const sessionMode = useLearningStore((s) => s.sessionMode);
  const sessionFinished = useLearningStore((s) => s.sessionFinished);
  const queue = useLearningStore((s) => s.queue);
  const currentIndex = useLearningStore((s) => s.currentIndex);
  const flipped = useLearningStore((s) => s.flipped);
  const wordMastery = useLearningStore((s) => s.wordMastery);
  const favorites = useLearningStore((s) => s.favorites);
  const sessionAnswered = useLearningStore((s) => s.sessionAnswered);
  const sessionQualitySum = useLearningStore((s) => s.sessionQualitySum);
  const submitGrade = useLearningStore((s) => s.submitGrade);
  const setFlipped = useLearningStore((s) => s.setFlipped);
  const toggleFavorite = useLearningStore((s) => s.toggleFavorite);
  const dismissCompletion = useLearningStore((s) => s.dismissCompletion);
  const replaySession = useLearningStore((s) => s.replaySession);

  const bundle = queue[currentIndex];
  const active = !sessionFinished && queue.length > 0 && sessionMode !== 'idle';

  const title = useMemo(() => {
    if (sessionFinished) {
      return '学习完成';
    }
    if (sessionMode === 'review') {
      return '到期复习';
    }
    if (sessionMode === 'new') {
      return '今日新词';
    }
    return '学习';
  }, [sessionFinished, sessionMode]);

  const subtitle = useMemo(() => {
    if (sessionFinished) {
      return '保持节奏比完美更重要';
    }
    if (sessionMode === 'review') {
      return '温故而知新，给记忆一点耐心';
    }
    return '拆词推理，把结构刻进脑子里';
  }, [sessionFinished, sessionMode]);

  const previewSentence = bundle?.examples[0]?.sentence ?? null;

  const accuracyLabel = useMemo(() => {
    if (sessionAnswered === 0) {
      return '—';
    }
    return `${Math.round((sessionQualitySum / sessionAnswered) * 100)}%`;
  }, [sessionAnswered, sessionQualitySum]);

  const openRoot = (form: string): void => {
    Taro.navigateTo({ url: `/pages/root-detail/index?form=${encodeURIComponent(form)}` });
  };

  const openDetail = (spelling: string): void => {
    Taro.navigateTo({ url: `/pages/word-detail/index?spelling=${encodeURIComponent(spelling)}` });
  };

  useEffect(() => {
    if (sessionFinished) {
      hapticSuccess();
    }
  }, [sessionFinished]);

  if (sessionFinished) {
    return (
      <View className="page learn-page">
        <Text className="learn-page__title">{title}</Text>
        <Text className="learn-page__subtitle">{subtitle}</Text>
        <View className="learn-done ui-animate-bounce">
          <View className="learn-done__celebrate" aria-hidden>
            <Text className="learn-done__emoji">✓</Text>
          </View>
          <Text className="learn-done__line">本轮已答 {sessionAnswered} 词</Text>
          <Text className="learn-done__line">印象正确感 {accuracyLabel}</Text>
          <Button
            className="learn-done__primary"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticMedium();
              replaySession();
            }}
          >
            再练一组
          </Button>
          <Button
            className="learn-done__secondary"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              hapticLight();
              dismissCompletion();
            }}
          >
            完成
          </Button>
          <Button
            className="learn-done__ghost"
            hoverClass={HOVER_PRESS_LIGHT}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
          >
            回首页
          </Button>
        </View>
      </View>
    );
  }

  if (!active || !bundle) {
    return (
      <View className="page learn-page">
        <Text className="learn-page__title">{title}</Text>
        <Text className="learn-page__subtitle">从首页选择「新词」或「复习」开始一组学习</Text>
        <View className="learn-empty">
          <Text className="learn-empty__hint">今日小步前进，从一组词开始。</Text>
          <Button
            className="learn-empty__btn"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
          >
            去首页
          </Button>
        </View>
      </View>
    );
  }

  const mastery = wordMastery[bundle.word.id] ?? 1;

  return (
    <View className="page learn-page">
      <View className="learn-page__header">
        <View>
          <Text className="learn-page__title">{title}</Text>
          <Text className="learn-page__subtitle">{subtitle}</Text>
        </View>
        <View className="learn-page__badge">
          <Text className="learn-page__badge-num">
            {currentIndex + 1}/{queue.length}
          </Text>
        </View>
      </View>

      <View className="learn-page__progress">
        <View
          className="learn-page__progress-fill"
          style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
        />
      </View>

      <WordCard
        word={bundle.word}
        mastery={mastery}
        flipped={flipped}
        isFavorite={Boolean(favorites[bundle.word.id])}
        previewSentence={previewSentence}
        onToggleFlip={() => setFlipped(!flipped)}
        onGrade={(g) => void submitGrade(g)}
        onOpenRoot={openRoot}
        onToggleFavorite={() => toggleFavorite(bundle.word.id)}
        onOpenDetail={() => openDetail(bundle.word.spelling)}
      />

      <View className="learn-page__section">
        <Text className="learn-page__section-title">分层例句</Text>
        <ExampleList examples={bundle.examples} />
      </View>
    </View>
  );
}
