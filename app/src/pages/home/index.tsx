import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { Button, Text, View } from '@tarojs/components';
import { MVP_ROOT_LIBRARY } from '@/data/mvp';
import { useLearningStore } from '@/store/learning';
import './index.scss';

export default function HomePage(): ReactElement {
  const plan = useLearningStore((s) => s.planSummary);
  const startSession = useLearningStore((s) => s.startSession);
  const newBundles = useLearningStore((s) => s.newBundles);
  const reviewBundles = useLearningStore((s) => s.reviewBundles);

  const goLearn = (): void => {
    Taro.switchTab({ url: '/pages/learn/index' });
  };

  const startNew = (): void => {
    startSession('new');
    goLearn();
  };

  const startReview = (): void => {
    startSession('review');
    goLearn();
  };

  const openReport = (): void => {
    Taro.navigateTo({ url: '/pages/report/index' });
  };

  const openRoot = (form: string): void => {
    Taro.navigateTo({ url: `/pages/root-detail/index?form=${encodeURIComponent(form)}` });
  };

  const rootPreview = Object.keys(MVP_ROOT_LIBRARY).slice(0, 3);

  return (
    <View className="page home-page">
      <View className="home-hero">
        <Text className="home-hero__eyebrow">词根记忆 · 科学复习</Text>
        <Text className="home-hero__title">把背单词变成推理游戏</Text>
        <Text className="home-hero__desc">
          通过词根拆解、分层例句和间隔复习，把碎片时间变成可迁移的词汇网络。
        </Text>
      </View>

      <View className="home-plan">
        <Text className="home-plan__title">今日计划</Text>
        <View className="home-plan__row">
          <View className="home-plan__pill">
            <Text className="home-plan__num">{plan?.dailyNew ?? 10}</Text>
            <Text className="home-plan__lbl">新词</Text>
          </View>
          <View className="home-plan__pill">
            <Text className="home-plan__num">{plan?.dailyReview ?? 20}</Text>
            <Text className="home-plan__lbl">复习</Text>
          </View>
          <View className="home-plan__pill home-plan__pill--wide">
            <Text className="home-plan__tag">{plan?.examType?.toUpperCase() ?? 'CET'}</Text>
            <Text className="home-plan__lbl">目标词库</Text>
          </View>
        </View>
        <Text className="home-plan__queue">
          队列：新词 {newBundles.length} · 复习 {reviewBundles.length}
        </Text>
      </View>

      <View className="home-actions">
        <Button className="home-actions__primary" onClick={startNew}>
          开始新词
        </Button>
        <Button className="home-actions__secondary" onClick={startReview}>
          开始复习
        </Button>
      </View>

      <View className="home-roots">
        <Text className="home-roots__title">词根成长</Text>
        <Text className="home-roots__desc">点击词根查看派生词与经典例句</Text>
        <View className="home-roots__chips">
          {rootPreview.map((form) => (
            <Text key={form} className="home-roots__chip" onClick={() => openRoot(form)}>
              {form}
            </Text>
          ))}
        </View>
      </View>

      <Button className="home-report-btn" onClick={openReport}>
        查看学习报告
      </Button>
    </View>
  );
}
