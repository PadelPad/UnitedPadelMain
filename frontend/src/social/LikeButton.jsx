import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function LikeButton({ postId, initialCount = 0 }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
      if (data?.id) setLiked(true);
    })();
  }, [postId]);

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!liked) {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      if (!error) { setLiked(true); setCount(c => c + 1); }
    } else {
      const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      if (!error) { setLiked(false); setCount(c => Math.max(0, c - 1)); }
    }
  }

  return (
    <button className="action" onClick={toggle}>
      {liked ? '💥 Liked' : '👍 Like'} · {count}
    </button>
  );
}
