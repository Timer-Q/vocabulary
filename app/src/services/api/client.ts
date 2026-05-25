import Taro from '@tarojs/taro';
import { API_REQUEST_TIMEOUT_MS, getApiBaseUrl } from '@/config/api';
import { ApiResponse } from './types';

export async function request<T>(
  path: string,
  options: Omit<Taro.request.Option, 'url'> = {},
): Promise<T> {
  let token = '';
  try {
    token = Taro.getStorageSync<string>('token') ?? '';
  } catch {
    /* 游客模式可能无法读 storage */
  }

  const response = await Taro.request<ApiResponse<T>>({
    ...options,
    url: `${getApiBaseUrl()}${path}`,
    timeout: options.timeout ?? API_REQUEST_TIMEOUT_MS,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.header ?? {}),
    },
  });

  if (response.statusCode >= 400 || response.data?.code !== 0) {
    throw new Error(response.data?.message ?? `request_failed_${response.statusCode}`);
  }

  return response.data.data;
}
