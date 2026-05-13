export interface LoginResult {
  code: string;
}

export interface SharePayload {
  title: string;
  path: string;
  imageUrl?: string;
}

export interface RewardedAdResult {
  transId: string;
}

export interface PlatformAdapter {
  login(): Promise<LoginResult>;
  showRewardedAd(scene: string): Promise<RewardedAdResult>;
  subscribeMessage(templateIds: string[]): Promise<void>;
  share(payload: SharePayload): void;
}
