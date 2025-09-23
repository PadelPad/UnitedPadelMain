// /components/Notifications/NotificationToast.jsx
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function NotificationToast({ notification }) {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const actionUrl = (notification?.type === 'match_confirmation' && notification?.metadata?.match_id)
    ? `/approvals?match=${notification.metadata.match_id}`
    : null;

  const onClick = useCallback(async () => {
    if (notification?.id) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    }
    if (actionUrl) navigate(actionUrl);
    setVisible(false);
  }, [notification?.id, actionUrl, navigate]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-5 right-5 z-50 bg-white border shadow-lg rounded-xl px-4 py-3 cursor-pointer max-w-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={onClick}
          role={actionUrl ? 'button' : undefined}
          tabIndex={actionUrl ? 0 : -1}
          onKeyDown={(e) => actionUrl && (e.key === 'Enter' || e.key === ' ') && onClick()}
        >
          <div className="font-bold">{notification.title || 'Notification'}</div>
          {notification.message && (
            <div className="text-sm text-gray-700">{notification.message}</div>
          )}
          {actionUrl && <div className="text-xs text-blue-600 mt-1">Open approvals</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
