import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function CommentsPanel({ postId }) {
  const [rows, setRows] = useState([]);
  const [txt, setTxt] = useState('');

  async function load() {
    const { data } = await supabase
      .from('comments_view') // your earlier view name; fallback to comments table if needed
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setRows(data || []);
  }

  useEffect(() => { load(); }, [postId]);

  async function add() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !txt.trim()) return;
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: txt.trim() });
    if (!error) { setTxt(''); load(); }
  }

  return (
    <div style={{ marginTop: '.6rem' }}>
      <div className="up-divider" style={{ margin: '.4rem 0 .6rem' }}></div>
      <div className="grid" style={{ gap: '.45rem' }}>
        {rows.map(r => (
          <div key={r.id} className="up-border" style={{ padding: '.5rem .6rem', background: 'rgba(255,255,255,.04)' }}>
            <div style={{ fontWeight: 700 }}>{r.full_name || r.username || 'User'}</div>
            <div style={{ color: 'var(--up-text)' }}>{r.content}</div>
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr auto', gap: '.45rem', marginTop: '.55rem' }}>
        <input className="up-input" placeholder="Add a comment…" value={txt} onChange={(e)=>setTxt(e.target.value)} />
        <button className="up-btn" onClick={add}>Send</button>
      </div>
    </div>
  );
}
