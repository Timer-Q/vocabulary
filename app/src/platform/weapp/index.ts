import Taro from '@tarojs/taro';
import { PlatformAdapter, RewardedAdResult, SharePayload } from '../types';

const weappAdapter: PlatformAdapter = {
  async login() {
    const result = await Taro.login();
    return { code: result.code };
  },

  async showRewardedAd(scene: string): Promise<RewardedAdResult> {
    return { transId: `weapp_${scene}_${Date.now()}` };
  },

  async subscribeMessage(templateIds: string[]): Promise<void> {
    await Taro.requestSubscribeMessage({
      tmplIds: templateIds,
    } as unknown as Parameters<typeof Taro.requestSubscribeMessage>[0]);
  },

  share(payload: SharePayload): void {
    Taro.showShareMenu({ withShareTicket: true });
    Taro.setClipboardData({ data: `${payload.title} ${payload.path}` });
  },
};

export default weappAdapter;
