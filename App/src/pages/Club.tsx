import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type ClubRow = {
  id: string;
  name: string;
  bio: string | null;
  location: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  username: string | null;
};

export default function Club() {
  const [club, setClub] = useState<ClubRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('clubs')
        .select('id, name, bio, location, banner_url, avatar_url, subscription_tier, username')
        .order('created_at', { ascending: false })
        .limit(1);
      setClub(data?.[0] ?? null);
    })();
  }, []);

  if (!club) return <p>No club found.</p>;

  return (
    <div>
      <h2>Club</h2>
      {club.banner_url && <img src={club.banner_url} alt="banner" style={{ width: '100%', borderRadius: 8 }} />}
      <h3>{club.name}</h3>
      <p>@{club.username || club.id}</p>
      <p>Tier: {club.subscription_tier}</p>
      <p>Location: {club.location ?? '-'}</p>
      {club.bio && <p style={{ whiteSpace: 'pre-wrap' }}>{club.bio}</p>}
    </div>
  );
}
