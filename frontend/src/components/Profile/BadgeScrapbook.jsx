// /src/components/Profile/BadgeScrapbook.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const slugify = (s = '') =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function BadgeScrapbook({
  isOpen,
  onClose,
  entityType = 'user', // 'user' | 'club'
  entityId,
  subscriptionTier,
  perPage = 6,
}) {
  const [loading, setLoading]   = useState(true);
  const [badges, setBadges]     = useState([]);
  const [earnedMap, setEarnedMap] = useState({});
  const [error, setError]       = useState(null);

  // UI
  const [page, setPage]         = useState(0);
  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState('all'); // all | earned | locked | mystery

  const isPlusOrElite = useMemo(() => {
    const t = (subscriptionTier || '').toLowerCase();
    return t === 'plus' || t === 'elite';
  }, [subscriptionTier]);

  const onKey = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
    if (e.key === 'ArrowRight') setPage(p => p + 1);
    if (e.key === 'ArrowLeft')  setPage(p => Math.max(0, p - 1));
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onKey]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch all badges
        const { data: badgeRows, error: bErr } = await supabase
          .from('badges')
          .select('id, title, description, icon_url, rarity, is_mystery, slug, created_at')
          .order('created_at', { ascending: true });
        if (bErr) throw bErr;

        // fetch earned/progress
        let progress = [];
        if (entityType === 'user') {
          progress = await fetchUserProgress(entityId);
        } else {
          // club
          const { data, error } = await supabase
            .from('club_badges')
            .select('badge_id, earned_at, progress, is_claimed')
            .eq('club_id', entityId);
          progress = error ? [] : (data || []);
        }

        const map = {};
        for (const r of (progress || [])) {
          map[r.badge_id] = {
            earned_at: r.earned_at,
            progress: typeof r.progress === 'number' ? r.progress : (r.earned_at ? 100 : 0),
            is_claimed: !!r.is_claimed
          };
        }

        setBadges(badgeRows || []);
        setEarnedMap(map);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load badges');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, entityType, entityId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (badges || []).filter(b => {
      const state  = earnedMap[b.id] || {};
      const earned = !!state.earned_at || (state.progress >= 100);
      const locked = !earned;

      if (filter === 'earned' && !earned) return false;
      if (filter === 'locked' && earned)  return false;
      if (filter === 'mystery' && !b.is_mystery) return false;

      if (!q) return true;
      if (b.is_mystery && locked) return false; // hide mystery from search until earned

      return ((b.title || '').toLowerCase().includes(q) ||
              (b.description || '').toLowerCase().includes(q));
    });
  }, [badges, earnedMap, filter, query]);

  const totalPages = Math.max(1, Math.ceil((filtered.length || 0) / perPage));
  const pageClamped = Math.min(page, totalPages - 1);
  const start = pageClamped * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  if (!isOpen) return null;

  return (
    <div className="badgeModalOverlay" role="dialog" aria-modal="true">
      <div className="badgeModal">
        <button className="badgeModalClose" onClick={onClose} aria-label="Close">✕</button>

        <div className="badgeHeader">
          <h3>Badges Scrapbook</h3>
          <div className="badgeHeaderControls">
            <div className="badgeSearch">
              <span>🔎</span>
              <input
                type="text"
                placeholder="Search badges…"
                value={query}
                onChange={(e)=>{ setQuery(e.target.value); setPage(0); }}
              />
            </div>
            <div className="badgeFilters">
              {['all','earned','locked','mystery'].map(f => (
                <button
                  key={f}
                  className={`badgeFilter ${filter===f ? 'active' : ''}`}
                  onClick={()=>{ setFilter(f); setPage(0); }}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <span className={`tierChip tier-${(subscriptionTier || 'free').toLowerCase()}`}>
            {subscriptionTier || 'free'}
          </span>
        </div>

        {!isPlusOrElite ? (
          <div className="badgeGate">
            <div className="lock">🔒</div>
            <h4>Badges are for Plus &amp; Elite</h4>
            <p>Upgrade your membership to unlock the scrapbook and reveal mystery badges.</p>
            <a className="upgradeBtn" href="/subscriptions">Upgrade membership</a>
          </div>
        ) : (
          <div className="badgeBook">
            {loading && <div className="badgeLoading">Loading badges…</div>}
            {error && <div className="badgeError">Error: {error}</div>}

            {!loading && !error && (
              <>
                <div className="badgeGrid">
                  {pageItems.map((b) => {
                    const s = earnedMap[b.id] || {};
                    const earned = !!s.earned_at || (s.progress >= 100);
                    const locked = !earned;

                    const slug   = (b.slug && b.slug.trim()) || slugify(b.title || '');
                    const local  = `/badges/${slug}.png`;
                    const src    = (b.icon_url && b.icon_url.trim()) ? b.icon_url : local;

                    return (
                      <div key={b.id} className={`badgeTile ${locked ? 'locked' : 'earned'} rarity-${(b.rarity||'common').toLowerCase()}`}>
                        <div className="badgeIconWrap">
                          <img
                            src={src}
                            alt={earned ? (b.title || 'Badge') : 'Locked badge'}
                            className={`badgeIcon ${locked ? 'greyed' : ''}`}
                            loading="lazy"
                            onError={(e)=>{ e.currentTarget.src = '/badges/_default.png'; }}
                          />
                          {locked && <div className="badgeLock">🔒</div>}
                        </div>

                        <div className={`badgeMeta ${b.is_mystery && locked ? 'mystery' : ''}`}>
                          <h4 title={b.title || ''}>{b.is_mystery && locked ? '???' : (b.title || 'Untitled')}</h4>
                          <p>{b.is_mystery && locked ? 'Mystery badge — unlock to reveal.' : (b.description || '—')}</p>
                        </div>

                        <div className="badgeFooter">
                          {earned ? (
                            <span className="earnedTag">Earned</span>
                          ) : (
                            <MiniProgress value={Math.min(100, Math.max(0, Math.round(s.progress || 0)))} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="badgePager">
                  <button onClick={()=>setPage(p=>Math.max(0, p-1))} disabled={pageClamped===0}>← Prev</button>
                  <span className="pageInfo">{pageClamped+1} / {totalPages}</span>
                  <button onClick={()=>setPage(p=>Math.min(totalPages-1, p+1))} disabled={pageClamped>=totalPages-1}>Next →</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Try likely foreign-key names in order so this works with your schema. */
async function fetchUserProgress(entityId) {
  const candidates = ['user_id','profile_id','player_id','member_id'];
  for (const col of candidates) {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, progress, is_claimed')
      .eq(col, entityId);
    if (!error) return data || [];
  }
  return [];
}

function MiniProgress({ value = 0 }) {
  return (
    <div className="miniProgressRing" title={`${value}%`}>
      <div className="miniProgressFill" style={{ width: `${value}%` }} />
      <span className="miniProgressLabel">{value}%</span>
    </div>
  );
}
