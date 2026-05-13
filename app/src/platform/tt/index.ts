import Taro from '@tarojs/taro';
import { PlatformAdapter, RewardedAdResult, SharePayload } from '../types';

const ttAdapter: PlatformAdapter = {
  async login() {
    const result = await Taro.login();
    return { code: result.code };
  },

  async showRewardedAd(scene: string): Promise<RewardedAdResult> {
    return { transId: `tt_${scene}_${Date.now()}` };
  },

  async subscribeMessage(): Promise<void> {
    // 抖音端通知能力与微信订阅消息不同，业务层通过统一接口调用。
    return Promise.resolve();
  },

  share(payload: SharePayload): void {
    Taro.showShareMenu({ withShareTicket: true });
    Taro.setClipboardData({ data: `${payload.title} ${payload.path}` });
  },
};

export default ttAdapter;
