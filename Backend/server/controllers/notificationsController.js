// server/controllers/notificationsController.js
import { supabase } from '../supabase/client.js';

/**
 * Backend-only creator (call from other controllers/jobs)
 */
export async function createNotification({ user_id, type, title, message, metadata }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ user_id, type, title, message, metadata, is_read: false }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * GET /api/notifications/me
 * Lists the authenticated user’s notifications
 */
export const listMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read (only if it belongs to the user)
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
