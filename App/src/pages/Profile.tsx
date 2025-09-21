import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number | null;
  badges_count: number | null;
  matches_played: number | null;
  instagram_url: string | null;
  website_url: string | null;
  facebook_url: string | null;
};

export default function Profile() {
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, rating, badges_count, matches_played, instagram_url, website_url, facebook_url')
        .eq('id', user.id)
        .single();
      if (!error) setP(data as Profile);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!p) return <p>Not signed in. (Add Auth UI later.)</p>;

  return (
    <div>
      <h2>My Profile</h2>
      {p.avatar_url && <img src={p.avatar_url} alt="avatar" width={96} height={96} style={{ borderRadius: 8 }} />}
      <p><strong>@{p.username || p.id}</strong></p>
      <p>Rating: {p.rating ?? '-'}</p>
      <p>Matches played: {p.matches_played ?? 0}</p>
      <p>Badges: {p.badges_count ?? 0}</p>
      {p.bio && <p style={{ whiteSpace: 'pre-wrap' }}>{p.bio}</p>}
      <div style={{ display: 'flex', gap: 12 }}>
        {p.instagram_url && <a href={p.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
        {p.website_url && <a href={p.website_url} target="_blank" rel="noreferrer">Website</a>}
        {p.facebook_url && <a href={p.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
      </div>
    </div>
  );
}
