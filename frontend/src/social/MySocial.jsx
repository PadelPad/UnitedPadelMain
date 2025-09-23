import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import PostCard from './PostCard.jsx';

export default function MySocial() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles').select('id, full_name, username, avatar_url, rating, subscription_tier')
        .eq('id', user.id).single();
      setMe({ user, profile });

      const { data: posts } = await supabase
        .from('feed_with_reposts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25);
      setRows(posts || []);
    })();
  }, []);

  return (
    <div className="grid" style={{ gap: '12px' }}>
      <div className="up-glass up-panel ms-profile">
        <div className="up-ring"><img className="up-avatar" src={me?.profile?.avatar_url || 'https://placehold.co/100x100'} alt=""/></div>
        <div>
          <div className="ms-name">{me?.profile?.full_name || me?.profile?.username || 'You'}</div>
          <div className="ms-statrow">
            <span className="up-chip">Elo {me?.profile?.rating || 1000}</span>
            <span className="up-chip">Tier {me?.profile?.subscription_tier || 'basic'}</span>
          </div>
        </div>
      </div>

      {rows.map(r => (<PostCard key={`${r.repost_id || r.post_id}`} post={r} />))}
      {rows.length === 0 && <div className="center-muted">You haven’t posted yet.</div>}
    </div>
  );
}
