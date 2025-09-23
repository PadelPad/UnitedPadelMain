import { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function RepostButton({ postId, count = 0 }) {
  const [num, setNum] = useState(count);
  const [busy, setBusy] = useState(false);

  async function repost() {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { error } = await supabase.from('reposts').insert({ post_id: postId, user_id: user.id });
      if (error) throw error;
      setNum(n => n + 1);
    } catch (e) {
      alert(e.message || 'Failed to repost');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="action" onClick={repost} disabled={busy}>
      ↪️ Share · {num}
    </button>
  );
}
