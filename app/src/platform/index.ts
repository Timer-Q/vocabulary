import ttAdapter from './tt';
import { PlatformAdapter } from './types';
import weappAdapter from './weapp';

export const platform: PlatformAdapter =
  process.env.TARO_ENV === 'tt' ? ttAdapter : weappAdapter;

export type { PlatformAdapter, RewardedAdResult, SharePayload } from './types';
