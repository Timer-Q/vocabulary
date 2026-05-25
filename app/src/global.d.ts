declare module '*.scss';

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_APP_API_BASE?: string;
  }
}
