import Taro from '@tarojs/taro';
import type { CSSProperties, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import { HOVER_PRESS, HOVER_PRESS_LIGHT, HOVER_STAY_MS } from '@/constants/interaction';
import { MVP_ROOT_LIBRARY } from '@/data/mvp';
import { useTabSelected } from '@/hooks/use-tab-selected';
import { useLearningStore } from '@/store/learning';
import { hapticLight, hapticMedium } from '@/utils/haptic';
import './index.scss';

export default function HomePage(): ReactElement {
  useTabSelected(0);

  const plan = useLearningStore((s) => s.planSummary);
  const startSession = useLearningStore((s) => s.startSession);
  const newBundles = useLearningStore((s) => s.newBundles);
  const reviewBundles = useLearningStore((s) => s.reviewBundles);
  const hydrated = useLearningStore((s) => s.hydrated);

  const [shimmer, setShimmer] = useState(true);

  const rootPreview = Object.keys(MVP_ROOT_LIBRARY).slice(0, 6);
  const newDone = Math.max(0, (plan?.dailyNew ?? 10) - newBundles.length);
  const reviewDone = Math.max(0, (plan?.dailyReview ?? 20) - reviewBundles.length);

  const progressPct = useMemo(() => {
    const total = (plan?.dailyNew ?? 10) + (plan?.dailyReview ?? 20);
    const done = newDone + reviewDone;
    if (total <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((done / total) * 100));
  }, [plan?.dailyNew, plan?.dailyReview, newDone, reviewDone]);

  const ringStyle = useMemo(
    () =>
      ({
        '--progress': String(progressPct),
      }) as CSSProperties,
    [progressPct],
  );

  const goLearn = (): void => {
    Taro.switchTab({ url: '/pages/learn/index' });
  };

  const startNew = (): void => {
    hapticMedium();
    startSession('new');
    goLearn();
  };

  const startReview = (): void => {
    hapticMedium();
    startSession('review');
    goLearn();
  };

  const openReport = (): void => {
    hapticLight();
    Taro.navigateTo({ url: '/pages/report/index' });
  };

  const openRootsTab = (): void => {
    hapticLight();
    Taro.switchTab({ url: '/pages/roots/index' });
  };

  const openRoot = (form: string): void => {
    hapticLight();
    Taro.navigateTo({ url: `/pages/root-detail/index?form=${encodeURIComponent(form)}` });
  };

  const openMindmap = (): void => {
    hapticLight();
    const first = rootPreview[0];
    if (first) {
      Taro.navigateTo({
        url: `/pages/mindmap/index?form=${encodeURIComponent(first)}`,
      });
    }
  };

  return (
    <View className="page home-page">
      <View className="home-dashboard ui-animate-in">
        <View className="home-dashboard__top">
          <View>
            <Text className="home-dashboard__eyebrow">
              {hydrated ? '今日学习' : '加载计划…'}
            </Text>
            <Text className="home-dashboard__exam">{plan?.examType?.toUpperCase() ?? 'CET'} 词库</Text>
          </View>
          <View
            className="home-dashboard__ring-wrap ui-animate-ring-pulse"
            style={ringStyle}
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={openReport}
          >
            <View className="home-dashboard__ring">
              <Text className="home-dashboard__ring-num">{progressPct}%</Text>
              <Text className="home-dashboard__ring-lbl">今日进度</Text>
            </View>
            <Text className="home-dashboard__ring-hint">点击查看报告</Text>
          </View>
        </View>

        <View className="home-dashboard__stats">
          <View
            className="home-dashboard__stat"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={startNew}
          >
            <Text className="home-dashboard__stat-num">{plan?.dailyNew ?? 10}</Text>
            <Text className="home-dashboard__stat-lbl">新词目标</Text>
            <Text className="home-dashboard__stat-sub">队列 {newBundles.length} · 点按开始</Text>
          </View>
          <View
            className="home-dashboard__stat"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={startReview}
          >
            <Text className="home-dashboard__stat-num">{plan?.dailyReview ?? 20}</Text>
            <Text className="home-dashboard__stat-lbl">复习目标</Text>
            <Text className="home-dashboard__stat-sub">队列 {reviewBundles.length} · 点按开始</Text>
          </View>
        </View>

        <View className="home-dashboard__actions">
          <Button
            className={`home-dashboard__primary ui-shimmer-wrap ${shimmer ? 'is-shimmering' : ''}`}
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={() => {
              setShimmer(false);
              startNew();
            }}
          >
            开始新词
          </Button>
          <Button
            className="home-dashboard__secondary"
            hoverClass={HOVER_PRESS}
            hoverStayTime={HOVER_STAY_MS}
            onClick={startReview}
          >
            开始复习
          </Button>
        </View>

        <Text className="home-dashboard__tagline">拆词推理 · 词根网络 · 间隔复习</Text>
      </View>

      <View className="home-section ui-animate-in">
        <View className="home-section__head">
          <Text className="home-section__title">词根成长</Text>
          <View className="home-section__links">
            <Text
              className="home-section__link"
              hoverClass={HOVER_PRESS_LIGHT}
              hoverStayTime={HOVER_STAY_MS}
              onClick={openRootsTab}
            >
              查看全部
            </Text>
            <Text
              className="home-section__link"
              hoverClass={HOVER_PRESS_LIGHT}
              hoverStayTime={HOVER_STAY_MS}
              onClick={openMindmap}
            >
              思维导图 →
            </Text>
          </View>
        </View>
        <Text className="home-section__desc">掌握一个词根，解锁一串派生词</Text>
        <View className="home-section__chips ui-stagger">
          {rootPreview.map((form) => (
            <Text
              key={form}
              className="home-section__chip"
              hoverClass={HOVER_PRESS}
              hoverStayTime={HOVER_STAY_MS}
              onClick={() => openRoot(form)}
            >
              {form}
            </Text>
          ))}
        </View>
      </View>

      <Button
        className="home-report-btn"
        hoverClass={HOVER_PRESS_LIGHT}
        hoverStayTime={HOVER_STAY_MS}
        onClick={openReport}
      >
        查看学习报告
      </Button>
    </View>
  );
}
