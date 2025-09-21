// server/controllers/profilesController.js
import { supabase } from '../supabase/client.js';

// Create profile (called after auth signup)
export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id; // must come from auth
    const { username, region_id, city_id, club_id, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        username,
        region_id,
        city_id,
        club_id,
        avatar_url,
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update profile (only self)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
