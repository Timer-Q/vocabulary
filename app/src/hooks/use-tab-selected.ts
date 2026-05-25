import Taro, { getCurrentInstance, useDidShow } from '@tarojs/taro';
import { tabIndexFromRoute } from '@/custom-tab-bar/tab-items';
import type { CustomTabBarRef } from '@/custom-tab-bar';

export function useTabSelected(fallbackIndex: number): void {
  useDidShow(() => {
    const pages = Taro.getCurrentPages();
    const current = pages[pages.length - 1];
    const route = current?.route ?? '';
    const index = route ? tabIndexFromRoute(route) : fallbackIndex;
    const page = getCurrentInstance()?.page;
    if (!page) {
      return;
    }
    const tabBar = Taro.getTabBar<CustomTabBarRef>(page);
    tabBar?.setSelected(index);
  });
}
