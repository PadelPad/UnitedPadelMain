import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export async function registerForPushAndSave() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    final = req.status;
  }
  if (final !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync();
  const user = (await supabase.auth.getUser()).data.user;
  if (user && token?.data) {
    await supabase.from('push_tokens').upsert({ user_id: user.id, expo_push_token: token.data });
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.DEFAULT });
  }
}
