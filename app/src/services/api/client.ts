import Taro from '@tarojs/taro';
import { ApiResponse } from './types';

const API_BASE_URL = 'http://localhost:3000/v1';

export async function request<T>(
  path: string,
  options: Omit<Taro.request.Option, 'url'> = {},
): Promise<T> {
  const token = Taro.getStorageSync<string>('token');
  const response = await Taro.request<ApiResponse<T>>({
    ...options,
    url: `${API_BASE_URL}${path}`,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.header ?? {}),
    },
  });

  if (response.statusCode >= 400 || response.data.code !== 0) {
    throw new Error(response.data.message ?? 'request_failed');
  }

  return response.data.data;
}
