import Taro from '@tarojs/taro';
import type { ReactElement} from 'react';
import { useMemo } from 'react';
import { Button, Text, View } from '@tarojs/components';
import { ExampleList } from '@/components/example-list';
import { WordCard } from '@/components/word-card';
import { useLearningStore } from '@/store/learning';
import './index.scss';

export default function LearnPage(): ReactElement {
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

  if (sessionFinished) {
    return (
      <View className="page learn-page">
        <Text className="learn-page__title">{title}</Text>
        <Text className="learn-page__subtitle">{subtitle}</Text>
        <View className="learn-done">
          <Text className="learn-done__line">本轮已答 {sessionAnswered} 词</Text>
          <Text className="learn-done__line">印象正确感 {accuracyLabel}</Text>
          <Button className="learn-done__primary" onClick={() => replaySession()}>
            再练一组
          </Button>
          <Button className="learn-done__secondary" onClick={() => dismissCompletion()}>
            完成
          </Button>
          <Button className="learn-done__ghost" onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
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
          <Button className="learn-empty__btn" onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
            去首页
          </Button>
        </View>
      </View>
    );
  }

  const mastery = wordMastery[bundle.word.id] ?? 1;

  return (
    <View className="page learn-page">
      <Text className="learn-page__title">{title}</Text>
      <Text className="learn-page__subtitle">{subtitle}</Text>

      <View className="learn-page__progress">
        <Text className="learn-page__progress-text">
          {currentIndex + 1} / {queue.length}
        </Text>
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
