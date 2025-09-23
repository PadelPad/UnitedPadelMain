import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';
import PostCard from './PostCard.jsx';

const PAGE = 10;

function PostSkeleton() {
  return (
    <div className="post" aria-hidden>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'.75rem', alignItems:'center' }}>
        <div className="skel skel-avatar" />
        <div>
          <div className="skel skel-row" style={{ width:'40%' }} />
          <div className="skel skel-row" style={{ width:'28%' }} />
        </div>
      </div>
      <div className="skel skel-row" style={{ width:'100%', marginTop:'10px' }} />
      <div className="skel skel-media" style={{ marginTop:'8px' }} />
    </div>
  );
}

export default function Feed({ tag = null }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);

  const reset = useCallback(() => {
    setRows([]); setPage(0); setDone(false); setInitial(true);
  }, []);
  useEffect(() => { reset(); }, [tag, reset]);

  const load = useCallback(async () => {
    if (done || loading) return;
    setLoading(true);

    let data;
    if (tag) {
      const { data: ht } = await supabase.from('hashtags').select('id').eq('tag', tag).maybeSingle();
      if (!ht?.id) { setDone(true); setLoading(false); setInitial(false); return; }
      const from = page * PAGE; const to = from + PAGE - 1;
      const { data: links } = await supabase
        .from('post_hashtags')
        .select('post_id').eq('hashtag_id', ht.id)
        .order('created_at', { ascending: false }).range(from, to);
      const ids = (links || []).map(l => l.post_id);
      if (!ids.length) { setDone(true); setLoading(false); setInitial(false); return; }
      const res = await supabase.from('feed_with_reposts').select('*').in('post_id', ids).order('created_at', { ascending: false });
      data = res.data || [];
      if (!links || links.length < PAGE) setDone(true);
    } else {
      const from = page * PAGE; const to = from + PAGE - 1;
      const res = await supabase.from('feed_with_reposts').select('*').order('created_at', { ascending: false }).range(from, to);
      data = res.data || [];
      if (data.length < PAGE) setDone(true);
    }

    setRows(prev => [...prev, ...data]); setPage(p => p + 1);
    setLoading(false); setInitial(false);
  }, [page, done, tag, loading]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="grid" style={{ gap: '12px' }}>
      {initial && (
        <>
          <PostSkeleton /><PostSkeleton /><PostSkeleton />
        </>
      )}

      {!initial && rows.length === 0 && (
        <div className="empty-card">
          <span className="emoji">🕊️</span>
          <span>No posts yet. Be the first to share a highlight or challenge someone!</span>
        </div>
      )}

      {rows.map(r => <PostCard key={`${r.repost_id || r.post_id}`} post={r} />)}

      {!done && (
        <div className="center-muted">
          <button className="up-btn" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
    </div>
  );
}
