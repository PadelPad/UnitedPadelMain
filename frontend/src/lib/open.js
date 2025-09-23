import { Browser } from '@capacitor/browser';
import { isNative } from './native.js';

export async function openExternal(url) {
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
