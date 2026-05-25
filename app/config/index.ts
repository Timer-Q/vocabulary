import { defineConfig } from '@tarojs/cli';
import path from 'node:path';

const config = defineConfig<'webpack5'>(() => ({
  projectName: 'vocabulary-app',
  date: '2026-05-06',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  env: {
    TARO_APP_API_BASE: JSON.stringify(process.env.TARO_APP_API_BASE ?? 'http://127.0.0.1:3100/v1'),
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
    },
  },
  h5: {},
}));

export default config;
