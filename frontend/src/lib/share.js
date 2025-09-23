import { Share } from '@capacitor/share';
import { isNative } from './native.js';

export async function shareText(title, text, url) {
  if (!isNative()) {
    await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
    alert('Copied to clipboard');
    return;
  }
  await Share.share({ title, text, url });
}
