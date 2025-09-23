// /src/components/Notifications/NotificationBell.jsx
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useNotifications } from './useNotifications.js';
import NotificationsDropdown from './NotificationsDropdown.jsx';
import './notifications.css';

export default function NotificationBell() {
  const [userId, setUserId] = useState(null);
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    })();
  }, []);

  const { unreadCount } = useNotifications(userId);

  // click outside closes
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  if (!userId) return null;

  return (
    <div className="notif-bell-wrap">
      <button
        ref={btnRef}
        className="notif-bell-btn"
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a6 6 0 00-6 6v3.586L4.293 13.293A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
        {unreadCount > 0 && <span className="notif-badge" aria-live="polite">{unreadCount}</span>}
      </button>

      {open && (
        <div ref={popRef} className="notif-panel">
          <NotificationsDropdown userId={userId} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
