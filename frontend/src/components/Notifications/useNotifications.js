// /src/components/Notifications/useNotifications.js
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js'; // NOTE .js

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const computeUnread = (list) =>
    (list || []).reduce((acc, n) => acc + (!n.is_read ? 1 : 0), 0);

  const load = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) {
      setNotifications(data || []);
      setUnreadCount(computeUnread(data || []));
    }
  };

  useEffect(() => { load(); }, [userId]);

  // Realtime refresh on any row change for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId]);

  const markAllAsRead = async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, is_read: true }));
      setUnreadCount(0);
      return next;
    });
  };

  const markAsRead = async (id) => {
    if (!id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(computeUnread(next));
      return next;
    });
  };

  // Central deep-linker used by dropdown
  const navigateFromNotification = async (navigate, n) => {
    if (!n) return;
    if (!n.is_read) await markAsRead(n.id);

    // metadata may be null / string / object. Normalize.
    let meta = n.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = {}; }
    } else if (meta == null || typeof meta !== 'object') {
      meta = {};
    }

    switch (n.type) {
      case 'match_confirmation':
        if (meta.match_id) {
          navigate(`/approvals?match=${encodeURIComponent(meta.match_id)}`);
        } else {
          navigate('/approvals');
        }
        break;
      case 'badge_unlocked':
        navigate('/badges');
        break;
      case 'ranking':
        navigate('/leaderboard');
        break;
      case 'streak':
        navigate('/profile');
        break;
      default:
        navigate('/profile');
    }
  };

  return {
    notifications,
    unreadCount,
    hasNew: unreadCount > 0,
    markAllAsRead,
    markAsRead,
    navigateFromNotification,
    reload: load,
  };
}
