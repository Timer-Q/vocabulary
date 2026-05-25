import Taro from '@tarojs/taro';

export type HapticStyle = 'light' | 'medium' | 'heavy';

const TOURIST_APP_ID = 'touristappid';

/** 游客 AppID、开发者工具模拟器下部分 wx API 不可用，跳过震动避免报错 */
function canUseHaptic(): boolean {
  try {
    const sys = Taro.getSystemInfoSync();
    if (sys.platform === 'devtools') {
      return false;
    }
    const account = Taro.getAccountInfoSync?.();
    const appId = account?.miniProgram?.appId;
    if (!appId || appId === TOURIST_APP_ID) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

function vibrate(type: 'light' | 'medium' | 'heavy'): void {
  if (!canUseHaptic()) {
    return;
  }
  void Taro.vibrateShort({ type }).catch(() => undefined);
}

/** 轻触反馈（列表、Tab、次要按钮） */
export function hapticLight(): void {
  vibrate('light');
}

/** 标准点击（主按钮、卡片进入） */
export function hapticMedium(): void {
  vibrate('medium');
}

/** 强反馈（评分、完成、重要确认） */
export function hapticHeavy(): void {
  vibrate('heavy');
}

/** 成功类操作（熟练、完成学习） */
export function hapticSuccess(): void {
  hapticHeavy();
}

/** 警告类操作（模糊、陌生） */
export function hapticWarning(): void {
  hapticMedium();
}
