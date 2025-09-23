// components/ClubDashboard/ClubDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import './ClubDashboard.css';
import darkBg from '../../assets/padel-bg2.jpg';
import orangeBg from '../../assets/padel-bg.jpg';
import LockedOverlay from '../Club/LockedOverlay.jsx';
import { CLUB_FEATURES, hasFeature } from '../Club/clubFeatures';

export default function ClubDashboard() {
  // Top-level hooks only
  const { username } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (!alive) return;
      if (error) console.error('Club fetch error:', error);
      setClub(data || null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [username]);

  const tier = club?.subscription_tier || club?.subscription_plan || 'basic';
  const f = CLUB_FEATURES[tier] || CLUB_FEATURES.basic;
  const stats = club?.stats || {};
  const wins = Number(stats.total_wins || 0);
  const played = Number(stats.matches_played || 0);
  const losses = Math.max(played - wins, 0);
  const winRate = Number(stats.win_rate || 0);

  const goUpgrade = () => alert('Upgrade flow (Stripe) here.');

  if (loading) return <p className="cd-loading">Loading dashboard…</p>;
  if (!club) return <p className="cd-loading">Club not found.</p>;

  return (
    <div className="cd-wrap">
      {/* HERO */}
      <header className="cd-hero" style={{ backgroundImage: `url(${darkBg})` }}>
        <div className="cd-hero-overlay" />
        <div className="cd-hero-inner">
          <img className="cd-logo" src={club.avatar_url || '/assets/default-avatar.png'} alt="" />
          <div className="cd-hero-text">
            <h1>{club.name}</h1>
            <div className="cd-meta">
              <span className={`cd-tier cd-tier-${tier}`}>{f.label}</span>
              {club.location && <span className="cd-chip">📍 {club.location}</span>}
            </div>
          </div>
          {tier !== 'elite' && (
            <button className="cd-upgrade" onClick={goUpgrade}>Upgrade</button>
          )}
        </div>

        {/* quick KPIs */}
        <div className="cd-kpis">
          <div className="cd-kpi">
            <div className="cd-kpi-icon">🎾</div>
            <div className="cd-kpi-label">Matches</div>
            <div className="cd-kpi-value">{played}</div>
          </div>
          <div className="cd-kpi">
            <div className="cd-kpi-icon">🏆</div>
            <div className="cd-kpi-label">Wins</div>
            <div className="cd-kpi-value">{wins}</div>
          </div>
          <div className="cd-kpi">
            <div className="cd-kpi-icon">🔥</div>
            <div className="cd-kpi-label">Win Rate</div>
            <div className="cd-kpi-value">{winRate}%</div>
            <div className="cd-progress"><span style={{ width: `${Math.min(winRate, 100)}%` }} /></div>
          </div>
        </div>
      </header>

      {/* ABOUT PANEL */}
      {club.bio && (
        <section className="cd-section">
          <div className="cd-section-bar" style={{ backgroundImage: `url(${orangeBg})` }}>
            <h2>About</h2>
          </div>
          <div className="cd-panel">
            <div className="cd-panel-inner">
              <p className="cd-about">{club.bio}</p>
              <div className="cd-links">
                {club?.social_links?.website && <a href={club.social_links.website} target="_blank" rel="noreferrer">Website</a>}
                {club?.social_links?.instagram && <a href={club.social_links.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                {club?.social_links?.facebook && <a href={club.social_links.facebook} target="_blank" rel="noreferrer">Facebook</a>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STAFF */}
      {Array.isArray(club.coaches) && club.coaches.length > 0 && (
        <section className="cd-section">
          <div className="cd-section-bar" style={{ backgroundImage: `url(${orangeBg})` }}>
            <h2>Staff</h2>
          </div>
          <div className="cd-staff-grid">
            {club.coaches.map((c, i) => (
              <article key={i} className="cd-staff-card">
                <div className="cd-staff-bg" />
                <img src={c.photo || '/assets/default-avatar.png'} alt={c.name} />
                <div className="cd-staff-body">
                  <h4>{c.name}</h4>
                  <p>{c.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* EVENTS (tier-gated) */}
      <section className="cd-section">
        <div className="cd-section-bar" style={{ backgroundImage: `url(${orangeBg})` }}>
          <h2>Events</h2>
        </div>
        <div className="cd-panel cd-lock-host">
          {!hasFeature(club, 'canHostEvents') && (
            <LockedOverlay label="Events available on Plus & Elite" onClick={goUpgrade} />
          )}
          <div className="cd-panel-inner">
            <div className="cd-events">
              {(Array.isArray(club.upcoming_events) ? club.upcoming_events : []).map((e, i) => (
                <div key={i} className="cd-event">
                  <div className="cd-event-when">
                    <span>{e.date}</span>
                    <span>{e.time}</span>
                  </div>
                  <div className="cd-event-body">
                    <h4>{e.title}</h4>
                    {e.desc && <p>{e.desc}</p>}
                    {e.cta_url && <a href={e.cta_url} target="_blank" rel="noreferrer" className="cd-event-cta">Join</a>}
                  </div>
                </div>
              ))}
              {(!club.upcoming_events || club.upcoming_events.length === 0) && (
                <div className="cd-muted">No upcoming events.</div>
              )}
            </div>
            <div className="cd-actions">
              <button className="cd-primary" disabled={!hasFeature(club, 'canHostEvents')}>
                Create Event
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYTICS */}
      <section className="cd-section">
        <div className="cd-section-bar" style={{ backgroundImage: `url(${orangeBg})` }}>
          <h2>Analytics</h2>
        </div>
        <div className="cd-split">
          <div className="cd-panel cd-lock-host">
            {!hasFeature(club, 'analyticsCore') && (
              <LockedOverlay label="Core analytics on Plus & Elite" onClick={goUpgrade} />
            )}
            <div className="cd-panel-inner">
              <h3>Core</h3>
              <ul className="cd-bullets">
                <li>Match volume by week</li>
                <li>Top player streaks</li>
                <li>Basic court utilisation</li>
              </ul>
            </div>
          </div>
          <div className="cd-panel cd-lock-host">
            {!hasFeature(club, 'analyticsAdvanced') && (
              <LockedOverlay label="Advanced analytics are Elite only" onClick={goUpgrade} />
            )}
            <div className="cd-panel-inner">
              <h3>Advanced</h3>
              <ul className="cd-bullets">
                <li>Cohort retention & churn</li>
                <li>Hourly heatmaps per court</li>
                <li>Revenue & monetisation insights</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDING & SPONSORS */}
      <section className="cd-section">
        <div className="cd-section-bar" style={{ backgroundImage: `url(${orangeBg})` }}>
          <h2>Branding & Sponsors</h2>
        </div>
        <div className="cd-split">
          <div className="cd-panel cd-lock-host">
            {!hasFeature(club, 'brandingCustomisation') && (
              <LockedOverlay label="Branding is Plus & Elite" onClick={goUpgrade} />
            )}
            <div className="cd-panel-inner">
              <h3>Branding</h3>
              <div className="cd-muted">Upload banner, set theme colours…</div>
            </div>
          </div>
          <div className="cd-panel cd-lock-host">
            {!hasFeature(club, 'sponsorShowcase') && (
              <LockedOverlay label="Sponsor tiles are Elite only" onClick={goUpgrade} />
            )}
            <div className="cd-panel-inner">
              <h3>Sponsor Tiles</h3>
              <div className="cd-muted">Add sponsor logos & links to your profile.</div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="cd-section">
        <div className="cd-section-bar" style={{ backgroundImage: `url(${orangeBg})` }}>
          <h2>Gallery</h2>
        </div>
        <div className="cd-gallery">
          {(club?.gallery_images?.length ? club.gallery_images : []).slice(0, 8).map((src, i) => (
            <img key={i} src={src} alt={`gallery-${i}`} />
          ))}
          {(!club.gallery_images || club.gallery_images.length === 0) && (
            <div className="cd-muted">No images yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
