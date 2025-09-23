import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function ChallengeHub() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: inc } = await supabase
        .from('challenges_view') // if you created a view; else use table 'challenges'
        .select('*')
        .eq('opponent_id', user.id)
        .order('created_at', { ascending: false });
      setIncoming(inc || []);

      const { data: out } = await supabase
        .from('challenges_view')
        .select('*')
        .eq('challenger_id', user.id)
        .order('created_at', { ascending: false });
      setOutgoing(out || []);
    })();
  }, []);

  async function update(id, status) {
    await supabase.from('challenges').update({ status }).eq('id', id);
    // quick refresh
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inc } = await supabase.from('challenges_view').select('*').eq('opponent_id', user.id).order('created_at', { ascending: false });
    const { data: out } = await supabase.from('challenges_view').select('*').eq('challenger_id', user.id).order('created_at', { ascending: false });
    setIncoming(inc || []); setOutgoing(out || []);
  }

  return (
    <div className="grid" style={{ gap: '12px' }}>
      <div className="up-glass up-panel">
        <div style={{ fontWeight: 900, marginBottom: '.5rem' }}>Incoming Challenges</div>
        {incoming.length === 0 && <div className="center-muted">None right now.</div>}
        <div className="grid" style={{ gap: '.6rem' }}>
          {incoming.map(ch => (
            <div key={ch.id} className="challenge-card">
              <div style={{ fontWeight: 800 }}>{ch.title || 'Match Challenge'}</div>
              <div className="challenge-meta">From {ch.challenger_name || 'Player'} · {new Date(ch.created_at).toLocaleString()}</div>
              <div className="challenge-actions">
                <button className="up-btn" onClick={()=>update(ch.id, 'accepted')}>Accept</button>
                <button className="up-btn-ghost" onClick={()=>update(ch.id, 'declined')}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="up-glass up-panel">
        <div style={{ fontWeight: 900, marginBottom: '.5rem' }}>Your Sent Challenges</div>
        {outgoing.length === 0 && <div className="center-muted">No outgoing challenges.</div>}
        <div className="grid" style={{ gap: '.6rem' }}>
          {outgoing.map(ch => (
            <div key={ch.id} className="challenge-card">
              <div style={{ fontWeight: 800 }}>{ch.title || 'Match Challenge'}</div>
              <div className="challenge-meta">To {ch.opponent_name || 'Player'} · {ch.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
