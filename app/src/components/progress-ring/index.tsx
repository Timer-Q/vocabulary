import type { ReactElement } from 'react';
import { Text, View } from '@tarojs/components';
import './index.scss';

export interface ProgressRingProps {
  /** 熟练度 1–5 */
  mastery: number;
  label?: string;
}

export function ProgressRing(props: ProgressRingProps): ReactElement {
  const { mastery, label = '熟练度' } = props;
  const safe = Math.min(5, Math.max(1, Math.round(mastery || 1)));
  const segments = [1, 2, 3, 4, 5];

  return (
    <View className="progress-ring">
      <Text className="progress-ring__label">{label}</Text>
      <View className="progress-ring__segments" aria-label={`熟练度${safe}级`}>
        {segments.map((i) => (
          <View key={i} className={`progress-ring__seg ${i <= safe ? 'is-on' : ''}`} />
        ))}
      </View>
    </View>
  );
}
