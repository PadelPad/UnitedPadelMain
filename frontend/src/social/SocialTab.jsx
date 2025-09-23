// src/social/SocialTab.jsx
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import Feed from './Feed.jsx';
import MySocial from './MySocial.jsx';
import ChallengeHub from './ChallengeHub.jsx';
import AdminModeration from './AdminModeration.jsx';
import HashtagSearch from './HashtagSearch.jsx';
import PostComposer from './PostComposer.jsx';
import './social.css';

function TabButton({ active, onClick, icon, label }) {
  return (
    <button className={`up-tab ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="icon" aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function SocialTab() {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('feed'); // 'feed' | 'my' | 'challenges' | 'moderation'
  const [hashtag, setHashtag] = useState(null);

  // sticky/shrink state for composer
  const [stuck, setStuck] = useState(false);

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
        .select('id, username, full_name, avatar_url, is_admin, subscription_tier, rating')
        .eq('id', user.id)
        .single();
      setMe({ user, profile });
    })();
  }, []);

  // observe scroll to toggle shrink class
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="up-bg--orange" style={{ minHeight: '100vh' }}>
      <div className="page-wrap">
        <header className="up-social-header">
          <div className="up-title">United Padel Social</div>
          <div className="up-subtitle">Share results, highlights & kudos.</div>
        </header>

        {/* Sticky + shrinking composer */}
        <div className="sticky-wrap mb-6">
          <div className={`up-glass up-panel composer composer--floating ${stuck ? 'is-stuck' : ''}`}>
            <img
              className="avatar"
              src={me?.profile?.avatar_url || 'https://placehold.co/100x100'}
              alt=""
            />
            <PostComposer onPosted={() => { /* left for future realtime refresh hooks */ }} />
            <div className="inline-actions">{/* reserved for quick actions (polls, etc.) */}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="up-tabs mb-6">
          <TabButton active={tab === 'feed'} onClick={() => setTab('feed')} icon="📰" label="Feed" />
          <TabButton active={tab === 'my'} onClick={() => setTab('my')} icon="👤" label="My Social" />
          <TabButton active={tab === 'challenges'} onClick={() => setTab('challenges')} icon="⚔️" label="Challenges" />
          {isAdmin && (
            <TabButton active={tab === 'moderation'} onClick={() => setTab('moderation')} icon="🛡️" label="Moderation" />
          )}
        </div>

        {/* Hashtag Search strip (only for feed) */}
        {tab === 'feed' && (
          <div className="up-glass up-panel mb-6">
            <HashtagSearch active={hashtag} onSelect={(t) => setHashtag(t)} />
          </div>
        )}

        {/* Main grid */}
        <div className="up-grid">
          <section>
            {tab === 'feed' && <Feed tag={hashtag} />}
            {tab === 'my' && <MySocial />}
            {tab === 'challenges' && <ChallengeHub />}
            {tab === 'moderation' && isAdmin && <AdminModeration />}
          </section>

          <aside className="up-glass up-panel">
            {tab === 'feed' && (
              <>
                <h3 style={{ fontWeight: 900, marginBottom: '.5rem' }}>Trending</h3>
                <p className="up-subtitle">Explore hot tags, brand posts, and top players.</p>
                <div className="mt-6">
                  <HashtagSearch compact onSelect={(t) => setHashtag(t)} />
                </div>
              </>
            )}

            {tab === 'my' && (
              <>
                <h3 style={{ fontWeight: 900, marginBottom: '.5rem' }}>Badges</h3>
                <p className="up-subtitle">Your latest achievements.</p>
              </>
            )}

            {tab === 'challenges' && (
              <>
                <h3 style={{ fontWeight: 900, marginBottom: '.5rem' }}>Active Challengers</h3>
                <p className="up-subtitle">Players heating up this week.</p>
              </>
            )}

            {tab === 'moderation' && (
              <>
                <h3 style={{ fontWeight: 900, marginBottom: '.5rem' }}>Guidelines</h3>
                <p className="up-subtitle">Admins only. Review reports and take action.</p>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
