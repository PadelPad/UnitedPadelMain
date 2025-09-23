import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function HashtagSearch({ active=null, onSelect, compact=false }) {
  const [q, setQ] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('trending_hashtags') // a view; if not present, fallback to hashtags
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(12);
      setTags(data || []);
    })();
  }, []);

  const search = async (e) => {
    e?.preventDefault?.();
    if (!q.trim()) return;
    onSelect?.(q.replace('#',''));
  };

  return (
    <div className="hashtag-search">
      {!compact && <strong>#</strong>}
      <form onSubmit={search} style={{ display: 'flex', gap: '.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <input
          className="up-input hashtag-input"
          placeholder="Search #hashtag and press Enter"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="up-btn" type="submit">Search</button>
      </form>
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        {tags.map(t => (
          <span
            key={t.tag}
            className={`up-chip hashtag-chip ${active===t.tag ? 'is-active' : ''}`}
            onClick={()=>onSelect?.(t.tag)}
            role="button"
          >
            #{t.tag}
          </span>
        ))}
      </div>
    </div>
  );
}
