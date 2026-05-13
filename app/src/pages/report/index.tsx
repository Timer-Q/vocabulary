import type { ReactElement } from 'react';
import { Text, View } from '@tarojs/components';
import { MVP_REPORT } from '@/data/mvp';
import './index.scss';

export default function ReportPage(): ReactElement {
  const r = MVP_REPORT;
  const maxMin = Math.max(...r.dailyMinutes, 1);

  return (
    <View className="page report-page">
      <Text className="report__title">{r.title}</Text>
      <Text className="report__sub">{r.subtitle}</Text>

      <View className="report-chart">
        {r.dailyMinutes.map((m, i) => (
          <View key={r.weekLabels[i] ?? i} className="report-chart__col">
            <View className="report-chart__bar-wrap">
              <View className="report-chart__bar" style={{ height: `${(m / maxMin) * 160}rpx` }} />
            </View>
            <Text className="report-chart__lbl">{r.weekLabels[i]}</Text>
          </View>
        ))}
      </View>

      <View className="report-stats">
        <View className="report-stat">
          <Text className="report-stat__v">{r.accuracyPct}%</Text>
          <Text className="report-stat__k">正确感（示意）</Text>
        </View>
        <View className="report-stat">
          <Text className="report-stat__v">{r.wordsLearned}</Text>
          <Text className="report-stat__k">新词</Text>
        </View>
        <View className="report-stat">
          <Text className="report-stat__v">{r.reviewDone}</Text>
          <Text className="report-stat__k">复习</Text>
        </View>
        <View className="report-stat">
          <Text className="report-stat__v">{r.streakDays}</Text>
          <Text className="report-stat__k">连续天</Text>
        </View>
      </View>

      <Text className="report__h">词根掌握</Text>
      {r.rootCoverage.map((row) => (
        <View key={row.form} className="report-root">
          <View className="report-root__head">
            <Text className="report-root__form">{row.form}</Text>
            <Text className="report-root__pct">{row.percent}%</Text>
          </View>
          <View className="report-root__track">
            <View className="report-root__fill" style={{ width: `${row.percent}%` }} />
          </View>
        </View>
      ))}

      <Text className="report__h">成就</Text>
      {r.achievements.map((a) => (
        <View key={a.title} className="report-ach">
          <Text className="report-ach__t">{a.title}</Text>
          <Text className="report-ach__d">{a.description}</Text>
        </View>
      ))}
    </View>
  );
}
