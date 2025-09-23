// /src/components/Notifications/NotificationsDropdown.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from './useNotifications.js';
import './notifications.css';

export default function NotificationsDropdown({ userId, onClose }) {
  const navigate = useNavigate();
  const { notifications, hasNew, markAllAsRead, navigateFromNotification } = useNotifications(userId);

  const handleOpen = async (n) => {
    await navigateFromNotification(navigate, n);
    onClose?.();
  };

  return (
    <div className="notif-dropdown">
      <div className="notif-head">
        <span>Notifications {hasNew ? '•' : ''}</span>
        <button onClick={markAllAsRead} className="notif-link">Mark all as read</button>
      </div>

      <ul className="notif-list">
        {(!notifications || notifications.length === 0) && (
          <li className="notif-empty">No notifications</li>
        )}

        {notifications.map((n) => {
          const ts = n.created_at ? new Date(n.created_at).toLocaleString() : '';
          const isMatch = n.type === 'match_confirmation' && n?.metadata;

          return (
            <li key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
              <button className="notif-item-btn" onClick={() => handleOpen(n)}>
                <div className="notif-item-row">
                  {!n.is_read && <span className="notif-dot" aria-hidden="true" />}
                  <div className="notif-title">
                    {n.title || (isMatch ? 'Match Confirmation' : 'Notification')}
                  </div>
                </div>
                {n.message && <div className="notif-msg">{n.message}</div>}
                <div className="notif-foot">
                  <div className="notif-time">{ts}</div>
                  {isMatch && <div className="notif-cta">Open approvals →</div>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
