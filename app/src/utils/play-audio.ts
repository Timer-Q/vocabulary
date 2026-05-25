import Taro from '@tarojs/taro';

/** 播放远程音频；无 URL 时提示准备中 */
export function playAudioUrl(url: string | null | undefined, label: string): void {
  if (!url) {
    Taro.showToast({ title: '音频准备中', icon: 'none' });
    return;
  }
  const ctx = Taro.createInnerAudioContext();
  ctx.src = url;
  ctx.onError(() => {
    Taro.showToast({ title: `${label}播放失败`, icon: 'none' });
    ctx.destroy();
  });
  ctx.onEnded(() => ctx.destroy());
  ctx.play();
}
