import Taro from '@tarojs/taro';

/** 微信开发者工具内 localhost 常解析失败，优先 127.0.0.1 */
const DEFAULT_API_BASE = 'http://127.0.0.1:3100/v1';

const STORAGE_KEY = 'API_BASE_URL';

/**
 * 本地 API 根地址。
 * 真机调试时可在控制台执行：
 * `Taro.setStorageSync('API_BASE_URL', 'http://192.168.x.x:3100/v1')`
 */
export function getApiBaseUrl(): string {
  try {
    const stored = Taro.getStorageSync<string>(STORAGE_KEY);
    if (typeof stored === 'string' && stored.startsWith('http')) {
      return stored.replace(/\/$/, '');
    }
  } catch {
    /* 游客模式 storage 可能受限 */
  }

  if (typeof process !== 'undefined' && process.env.TARO_APP_API_BASE) {
    return process.env.TARO_APP_API_BASE.replace(/\/$/, '');
  }

  return DEFAULT_API_BASE;
}

export const API_REQUEST_TIMEOUT_MS = 6000;
