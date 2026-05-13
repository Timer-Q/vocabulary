import Taro, { useLoad } from '@tarojs/taro';
import type { ReactElement} from 'react';
import { useState } from 'react';
import { Text, View } from '@tarojs/components';
import { ExampleList } from '@/components/example-list';
import { MVP_ROOT_LIBRARY } from '@/data/mvp';
import type { RootDetailData } from '@/types/learning';
import './index.scss';

export default function RootDetailPage(): ReactElement {
  const [root, setRoot] = useState<RootDetailData | null>(null);

  useLoad((query) => {
    const raw = query.form;
    const form = typeof raw === 'string' ? raw.toLowerCase() : '';
    setRoot(MVP_ROOT_LIBRARY[form] ?? null);
  });

  const openWord = (spelling: string): void => {
    Taro.navigateTo({ url: `/pages/word-detail/index?spelling=${encodeURIComponent(spelling)}` });
  };

  if (!root) {
    return (
      <View className="page root-detail">
        <Text className="root-detail__empty">未找到该词根（MVP 静态库）</Text>
      </View>
    );
  }

  return (
    <View className="page root-detail">
      <Text className="root-detail__form">{root.form}</Text>
      <View className="root-detail__meta">
        <Text className="root-detail__pill">{root.originLabel}</Text>
      </View>
      <Text className="root-detail__mean">{root.meaning}</Text>
      {root.extendedMeaning ? (
        <Text className="root-detail__ext">{root.extendedMeaning}</Text>
      ) : null}
      {root.story ? <Text className="root-detail__story">{root.story}</Text> : null}

      <Text className="root-detail__h">派生词</Text>
      <View className="root-detail__deriv">
        {root.derivatives.map((d) => (
          <Text key={d.spelling} className="root-detail__chip" onClick={() => openWord(d.spelling)}>
            {d.spelling}
            <Text className="root-detail__chip-gloss"> {d.gloss}</Text>
          </Text>
        ))}
      </View>

      <Text className="root-detail__h">词根级例句</Text>
      <ExampleList examples={root.examples} />
    </View>
  );
}
