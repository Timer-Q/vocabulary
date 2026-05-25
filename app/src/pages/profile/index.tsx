import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { Text, View } from '@tarojs/components';
import { HOVER_PRESS, HOVER_PRESS_LIGHT, HOVER_STAY_MS } from '@/constants/interaction';
import { useTabSelected } from '@/hooks/use-tab-selected';
import { useLearningStore } from '@/store/learning';
import { hapticLight, hapticMedium } from '@/utils/haptic';
import './index.scss';

export default function ProfilePage(): ReactElement {
  useTabSelected(3);

  const todayLearned = useLearningStore((s) => s.todayLearned);
  const plan = useLearningStore((s) => s.planSummary);
  const wordMastery = useLearningStore((s) => s.wordMastery);
  const progressCount = Object.keys(wordMastery).length;
  const masteredCount = Object.values(wordMastery).filter((m) => m >= 4).length;

  const openReport = (): void => {
    hapticLight();
    Taro.navigateTo({ url: '/pages/report/index' });
  };

  const openRoots = (): void => {
    hapticLight();
    Taro.switchTab({ url: '/pages/roots/index' });
  };

  const startLearn = (): void => {
    hapticMedium();
    Taro.switchTab({ url: '/pages/learn/index' });
  };

  return (
    <View className="page profile-page">
      <View className="profile-hero ui-animate-in">
        <Text className="profile-hero__title">我的学习</Text>
        <Text className="profile-hero__sub">
          目标 {plan?.examType?.toUpperCase() ?? 'CET'} · 每日 {plan?.dailyNew ?? 10} 新词 ·{' '}
          {plan?.dailyReview ?? 20} 复习
        </Text>
      </View>

      <View className="profile-grid ui-stagger">
        <View className="profile-card">
          <Text className="profile-card__value">{todayLearned}</Text>
          <Text className="profile-card__label">本轮作答</Text>
        </View>
        <View className="profile-card">
          <Text className="profile-card__value">{progressCount}</Text>
          <Text className="profile-card__label">已建立进度</Text>
        </View>
        <View className="profile-card profile-card--wide">
          <Text className="profile-card__value">{masteredCount}</Text>
          <Text className="profile-card__label">熟练及以上</Text>
        </View>
      </View>

      <View className="profile-actions">
        <Text
          className="profile-action profile-action--primary"
          hoverClass={HOVER_PRESS}
          hoverStayTime={HOVER_STAY_MS}
          onClick={startLearn}
        >
          继续学习
        </Text>
        <Text
          className="profile-action"
          hoverClass={HOVER_PRESS}
          hoverStayTime={HOVER_STAY_MS}
          onClick={openReport}
        >
          学习报告
        </Text>
        <Text
          className="profile-action"
          hoverClass={HOVER_PRESS_LIGHT}
          hoverStayTime={HOVER_STAY_MS}
          onClick={openRoots}
        >
          词根库
        </Text>
      </View>
    </View>
  );
}
