export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/roots/index',
    'pages/learn/index',
    'pages/profile/index',
    'pages/word-detail/index',
    'pages/root-detail/index',
    'pages/mindmap/index',
    'pages/report/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#F2F2F7',
    navigationBarTitleText: '词根侠',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F2F2F7',
  },
  tabBar: {
    custom: true,
    color: '#8E8E93',
    selectedColor: '#007AFF',
    backgroundColor: '#F2F2F7',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tab/placeholder.png',
        selectedIconPath: 'assets/tab/placeholder.png',
      },
      {
        pagePath: 'pages/roots/index',
        text: '词根',
        iconPath: 'assets/tab/placeholder.png',
        selectedIconPath: 'assets/tab/placeholder.png',
      },
      {
        pagePath: 'pages/learn/index',
        text: '学习',
        iconPath: 'assets/tab/placeholder.png',
        selectedIconPath: 'assets/tab/placeholder.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tab/placeholder.png',
        selectedIconPath: 'assets/tab/placeholder.png',
      },
    ],
  },
});
