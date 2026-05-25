import Taro from '@tarojs/taro';
import type { ReactElement } from 'react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { HOVER_PRESS_BOUNCE, HOVER_STAY_MS } from '@/constants/interaction';
import { hapticLight, hapticMedium } from '@/utils/haptic';
import { TAB_ITEMS } from './tab-items';
import './index.scss';

export interface CustomTabBarRef {
  setSelected: (index: number) => void;
}

const CustomTabBar = forwardRef<CustomTabBarRef>((_props, ref): ReactElement => {
  const [selected, setSelected] = useState(0);
  const [bumpIndex, setBumpIndex] = useState<number | null>(null);
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    setSelected: (index: number) => {
      setSelected(index);
    },
  }));

  const onSwitch = (index: number, pagePath: string): void => {
    if (index === selected) {
      hapticLight();
      return;
    }
    const isLearn = TAB_ITEMS[index]?.accent;
    if (isLearn) {
      hapticMedium();
    } else {
      hapticLight();
    }
    setSelected(index);
    setBumpIndex(index);
    if (bumpTimerRef.current) {
      clearTimeout(bumpTimerRef.current);
    }
    bumpTimerRef.current = setTimeout(() => setBumpIndex(null), 420);
    void Taro.switchTab({ url: pagePath });
  };

  return (
    <View className="custom-tab-bar">
      <View className="custom-tab-bar__dock">
        {TAB_ITEMS.map((item, index) => {
          const isActive = selected === index;
          const isAccent = Boolean(item.accent);
          const isBumping = bumpIndex === index;
          return (
            <View
              key={item.pagePath}
              className={`custom-tab-bar__item ${isActive ? 'is-active' : ''} ${isAccent ? 'is-accent' : ''} ${isBumping ? 'is-bumping' : ''}`}
              hoverClass={isAccent ? HOVER_PRESS_BOUNCE : HOVER_PRESS_BOUNCE}
              hoverStayTime={HOVER_STAY_MS}
              onClick={() => onSwitch(index, item.pagePath)}
            >
              <Text className="custom-tab-bar__icon">{item.icon}</Text>
              <Text className="custom-tab-bar__label">{item.text}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

CustomTabBar.displayName = 'CustomTabBar';

export default CustomTabBar;
