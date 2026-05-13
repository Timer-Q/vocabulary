export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/learn/index',
    'pages/profile/index',
    'pages/word-detail/index',
    'pages/root-detail/index',
    'pages/report/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1B2A4E',
    navigationBarTitleText: '词根侠',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#64748B',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
      },
      {
        pagePath: 'pages/learn/index',
        text: '学习',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
});
