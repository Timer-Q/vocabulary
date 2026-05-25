export interface TabItemConfig {
  pagePath: string;
  text: string;
  icon: string;
  accent?: boolean;
}

export const TAB_ITEMS: TabItemConfig[] = [
  { pagePath: '/pages/home/index', text: '首页', icon: '⌂' },
  { pagePath: '/pages/roots/index', text: '词根', icon: '⎇' },
  { pagePath: '/pages/learn/index', text: '学习', icon: '◆', accent: true },
  { pagePath: '/pages/profile/index', text: '我的', icon: '○' },
];

export function tabIndexFromRoute(route: string): number {
  const path = route.startsWith('/') ? route : `/${route}`;
  const idx = TAB_ITEMS.findIndex((item) => path.includes(item.pagePath.replace(/^\//, '')));
  return idx >= 0 ? idx : 0;
}
