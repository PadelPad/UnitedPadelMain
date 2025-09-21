import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Row = {
  id: string;
  username: string | null;
  rating: number | null;
  matches_played: number | null;
  club: string | null;
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, rating, matches_played, club')
        .order('rating', { ascending: false })
        .limit(100);
      setRows(data || []);
    })();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Rating</th>
            <th>Matches</th>
            <th>Club</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r.username || r.id}</td>
              <td>{r.rating ?? '-'}</td>
              <td>{r.matches_played ?? 0}</td>
              <td>{r.club ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
