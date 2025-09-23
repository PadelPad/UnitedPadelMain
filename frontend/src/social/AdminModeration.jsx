import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function AdminModeration() {
  const [me, setMe] = useState(null);
  const [reports, setReports] = useState([]);
  const [postsById, setPostsById] = useState({});
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => {
    const p = me?.profile;
    return !!(p && (p.is_admin || p.subscription_tier === 'elite'));
  }, [me]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_admin, subscription_tier, avatar_url, full_name')
        .eq('id', user.id).single();
      setMe({ user, profile });
    })();
  }, []);

  async function load() {
    setLoading(true);
    const { data: rep } = await supabase
      .from('post_reports')
      .select('id, post_id, reporter_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    const reportsList = rep || [];
    const postIds = [...new Set(reportsList.map(r => r.post_id))];
    const reporterIds = [...new Set(reportsList.map(r => r.reporter_id))];

    const [{ data: posts }, { data: profs }] = await Promise.all([
      postIds.length ? supabase.from('posts').select('id, content, status').in('id', postIds) : { data: [] },
      reporterIds.length ? supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', reporterIds) : { data: [] }
    ]);

    setPostsById(Object.fromEntries((posts || []).map(p => [p.id, p])));
    setProfilesById(Object.fromEntries((profs || []).map(p => [p.id, p])));
    setReports(reportsList);
    setLoading(false);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function setStatus(postId, status) {
    const { error } = await supabase.rpc('admin_set_post_status', { _post_id: postId, _status: status });
    if (!error) load();
  }

  if (!isAdmin) return <div className="center-muted">Admins only.</div>;

  return (
    <div className="mod-grid">
      {loading && <div className="center-muted">Loading…</div>}
      {!loading && reports.length === 0 && <div className="center-muted">No reports.</div>}
      {reports.map(r => {
        const post = postsById[r.post_id];
        const reporter = profilesById[r.reporter_id];
        return (
          <div key={r.id} className="mod-card">
            <div>
              <div style={{ display:'flex', gap:'.6rem', alignItems:'center', marginBottom:'.35rem' }}>
                <img src={reporter?.avatar_url || 'https://placehold.co/80x80'} alt="" className="up-avatar" />
                <div>
                  <div style={{ fontWeight:800 }}>{reporter?.full_name || reporter?.username || 'User'}</div>
                  <div className="post__meta">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <span className="up-chip" style={{ marginLeft:'auto' }}>{post?.status || 'active'}</span>
              </div>
              <div className="up-border" style={{ padding: '.6rem .7rem', background:'rgba(255,255,255,.04)' }}>
                <div style={{ fontWeight:700, marginBottom:'.25rem' }}>Reason</div>
                <div style={{ color:'var(--up-text)' }}>{r.reason}</div>
              </div>
              <div className="up-border" style={{ padding: '.6rem .7rem', marginTop:'.5rem', background:'rgba(255,255,255,.04)' }}>
                <div style={{ fontWeight:700, marginBottom:'.25rem' }}>Post Preview</div>
                <div style={{ color:'var(--up-text)' }}>{post?.content}</div>
              </div>
            </div>
            <div className="mod-actions">
              <button className="up-btn" onClick={()=>setStatus(r.post_id, 'hidden')}>Hide</button>
              <button className="up-btn-ghost" onClick={()=>setStatus(r.post_id, 'removed')}>Remove</button>
              <button className="up-btn-ghost" onClick={()=>setStatus(r.post_id, 'active')}>Restore</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
