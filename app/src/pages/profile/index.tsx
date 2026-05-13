import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { Text, View } from '@tarojs/components';
import { useLearningStore } from '@/store/learning';
import './index.scss';

export default function ProfilePage(): ReactElement {
  const todayLearned = useLearningStore((s) => s.todayLearned);
  const plan = useLearningStore((s) => s.planSummary);
  const wordMastery = useLearningStore((s) => s.wordMastery);
  const roots = Object.keys(wordMastery).length;

  const openReport = (): void => {
    Taro.navigateTo({ url: '/pages/report/index' });
  };

  return (
    <View className="page profile-page">
      <Text className="profile-page__title">我的学习</Text>
      <Text className="profile-page__sub">目标 {plan?.examType?.toUpperCase() ?? 'CET'} · 减压节奏</Text>

      <View className="profile-grid">
        <View className="profile-card">
          <Text className="profile-card__value">{todayLearned}</Text>
          <Text className="profile-card__label">累计作答（本会话）</Text>
        </View>
        <View className="profile-card">
          <Text className="profile-card__value">{roots}</Text>
          <Text className="profile-card__label">已建立进度词数</Text>
        </View>
      </View>

      <View className="profile-links">
        <Text className="profile-link" onClick={openReport}>
          学习报告 →
        </Text>
        <Text
          className="profile-link"
          onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
        >
          学习中心 →
        </Text>
      </View>
    </View>
  );
}
