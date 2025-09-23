import { PushNotifications } from '@capacitor/push-notifications';
import { isNative } from './native.js';

// Works on Android now; same JS works on iOS once APNs is configured.
export async function initPush(onToken, onNotification) {
  if (!isNative()) return;

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') {
    perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    if (onToken) onToken(token.value);
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', (n) => {
    if (onNotification) onNotification(n);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Notification action', action);
  });
}
