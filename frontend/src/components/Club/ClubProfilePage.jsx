// components/Club/ClubProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import styles from './Club.module.css';
import darkBg from '../../assets/padel-bg2.jpg';
import { CLUB_FEATURES } from './clubFeatures';

export default function ClubProfilePage() {
  const { username } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topPlayers, setTopPlayers] = useState([]);

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
      if (error) console.error(error);
      setClub(data || null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [username]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!club?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,full_name,avatar_url,rating,region')
        .eq('club_id', club.id)
        .order('rating', { ascending: false })
        .limit(12);
      if (!alive) return;
      if (error) console.error(error);
      setTopPlayers(data || []);
    })();
    return () => { alive = false; };
  }, [club?.id]);

  if (loading) return <p className={styles.loading}>Loading Club…</p>;
  if (!club) return <p className={styles.loading}>Club not found.</p>;

  const tier = club.subscription_tier || club.subscription_plan || 'basic';
  const tierLabel = { basic: 'Basic', plus: 'Plus', elite: 'Elite' }[tier] || 'Basic';
  const limits = (CLUB_FEATURES[tier] && CLUB_FEATURES[tier].showcase) || CLUB_FEATURES.basic.showcase;

  const stats = club.stats || {};
  const winRate = Number(stats.win_rate || 0);

  const coachesAll = Array.isArray(club.coaches) ? club.coaches : [];
  const playersAll = Array.isArray(topPlayers) ? topPlayers : [];
  const eventsAll  = Array.isArray(club.upcoming_events) ? club.upcoming_events : [];
  const galleryAll = Array.isArray(club.gallery_images) ? club.gallery_images : [];
  const sponsors   = Array.isArray(club.sponsors) ? club.sponsors : [];
  const hours      = club.opening_hours || null;
  const contact    = club.contact || null;

  const coaches = coachesAll.slice(0, limits.maxCoaches);
  const players = playersAll.slice(0, limits.maxPlayers);
  const events  = eventsAll.slice(0, limits.maxEvents);
  const gallery = galleryAll.slice(0, limits.maxGallery);

  const coachesTruncated = coachesAll.length > coaches.length;
  const playersTruncated = playersAll.length > players.length;
  const eventsTruncated  = eventsAll.length > events.length;
  const galleryTruncated = galleryAll.length > gallery.length;

  return (
    <div className={`${styles.page} ${styles.showcase}`}>
      {/* HERO */}
      <header className={styles.hero} style={{ backgroundImage: `url(${club.banner_url || darkBg})` }}>
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <img
            src={club.avatar_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=256&auto=format&fit=crop'}
            className={styles.clubAvatar}
            alt={`${club.name} logo`}
          />
          <div className={styles.heroText}>
            <h1 className={styles.clubName}>{club.name}</h1>
            <div className={styles.meta}>
              <span className={`${styles.tier} ${styles[`tier_${tier}`]}`}>{tierLabel} Club</span>
              {club.location && <span className={styles.chip}>📍 {club.location}</span>}
              {limits.showContact && club?.social_links?.website && (
                <a className={styles.chip} href={club.social_links.website} target="_blank" rel="noreferrer">Visit website</a>
              )}
              <Link className={styles.chip} to={`/club/${username}/dashboard`}>Owner? Manage</Link>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className={styles.heroKpis}>
          <div className={styles.kpi}><div className={styles.kpiIcon}>🎾</div><div className={styles.kpiLabel}>Matches</div><div className={styles.kpiValue}>{stats.matches_played || 0}</div></div>
          <div className={styles.kpi}><div className={styles.kpiIcon}>🏆</div><div className={styles.kpiLabel}>Wins</div><div className={styles.kpiValue}>{stats.total_wins || 0}</div></div>
          <div className={styles.kpi}>
            <div className={styles.kpiIcon}>🔥</div>
            <div className={styles.kpiLabel}>Win Rate</div>
            <div className={styles.kpiValue}>{winRate}%</div>
            <div className={styles.progress}><span style={{ width: `${Math.min(100, winRate)}%` }} /></div>
          </div>
        </div>
      </header>

      {/* ABOUT + VISIT */}
      {(club.bio || (limits.showHours && hours) || (limits.showContact && contact) || club?.social_links) && (
        <section className={styles.section}>
          <div className={styles.panelSoft}>
            <div className={styles.splitTwo}>
              <div>
                <h2 className={styles.h2}>About</h2>
                {club.bio && <p className={styles.about}>{club.bio}</p>}
                <div className={styles.links}>
                  {limits.showContact && club?.social_links?.instagram && <a href={club.social_links.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                  {limits.showContact && club?.social_links?.facebook && <a href={club.social_links.facebook} target="_blank" rel="noreferrer">Facebook</a>}
                </div>
              </div>
              <div>
                {(limits.showHours && hours) || (limits.showContact && contact) ? <h2 className={styles.h2}>Visit</h2> : null}
                {limits.showHours && hours && (
                  <ul className={styles.hours}>
                    {Object.entries(hours).map(([day, val]) => (
                      <li key={day}><span>{day}</span><span>{val}</span></li>
                    ))}
                  </ul>
                )}
                {limits.showContact && contact && (
                  <div className={styles.contact}>
                    {contact.phone && <a href={`tel:${contact.phone}`}>📞 {contact.phone}</a>}
                    {contact.email && <a href={`mailto:${contact.email}`}>✉️ {contact.email}</a>}
                    {club.location && <span>📍 {club.location}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STAFF */}
      {coaches.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Our Team</h2>
          <div className={styles.staffGrid}>
            {coaches.map((c, i) => (
              <article key={i} className={`${styles.staffCard} ${styles.soft}`}>
                <img
                  src={c.photo || `https://randomuser.me/api/portraits/${i % 2 ? 'women' : 'men'}/${(i + 21) % 80}.jpg`}
                  alt={c.name}
                />
                <div className={styles.staffBody}>
                  <h4>{c.name}</h4>
                  <p>{c.bio}</p>
                </div>
              </article>
            ))}
            {coachesTruncated && (
              <div className={styles.gate}>
                <span>Showing {coaches.length} of {coachesAll.length}. Upgrade to show your full team.</span>
                <Link to="/pricing" className={styles.gateBtn}>Upgrade</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TOP PLAYERS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.h2}>Top Players</h2>
          <Link className={styles.sectionLink} to={`/leaderboard?club=${club.id}`}>View leaderboard</Link>
        </div>
        <div className={styles.playerGrid}>
          {players.map((p) => (
            <div key={p.id} className={`${styles.playerCard} ${styles.soft}`}>
              <img
                src={p.avatar_url || 'https://images.unsplash.com/photo-1541534401786-2077eed87a56?w=200&auto=format&fit=crop'}
                alt={p.username}
              />
              <div>
                <div className={styles.playerName}>{p.full_name || p.username}</div>
                <div className={styles.playerMeta}>
                  <span>⭐ {Math.round(p.rating || 1000)}</span>
                  {p.region && <span>• {p.region}</span>}
                </div>
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <div className={styles.podiumEmpty}>
              <div className={`${styles.podium} ${styles.gold}`}>1</div>
              <div className={`${styles.podium} ${styles.silver}`}>2</div>
              <div className={`${styles.podium} ${styles.bronze}`}>3</div>
              <p className={styles.emptyText}>No rankings yet — be the first to play!</p>
            </div>
          )}
          {playersTruncated && (
            <div className={styles.gate}>
              <span>Showing {players.length} of {playersAll.length}. Upgrade to display more players.</span>
              <Link to="/pricing" className={styles.gateBtn}>Upgrade</Link>
            </div>
          )}
        </div>
      </section>

      {/* EVENTS */}
      {events.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Upcoming Events</h2>
          <div className={styles.events}>
            {events.map((e, i) => (
              <div key={i} className={`${styles.eventCard} ${styles.soft}`}>
                <div className={styles.eventWhen}>
                  <span>{e.date}</span>
                  <span>{e.time}</span>
                </div>
                <div className={styles.eventBody}>
                  <h4>{e.title}</h4>
                  {e.desc && <p>{e.desc}</p>}
                  {e.cta_url && <a href={e.cta_url} target="_blank" rel="noreferrer" className={styles.eventCta}>Join</a>}
                </div>
              </div>
            ))}
            {eventsTruncated && (
              <div className={styles.gate}>
                <span>Only {events.length} event visible on Basic.</span>
                <Link to="/pricing" className={styles.gateBtn}>Upgrade</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SPONSORS (hidden on Basic) */}
      {limits.showSponsors && sponsors.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Partners</h2>
          <div className={styles.sponsorStrip}>
            {sponsors.map((s, i) => (
              <a key={i} href={s.url || '#'} target="_blank" rel="noreferrer" className={styles.sponsorTile}>
                <img src={s.logo} alt={s.name} />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY */}
      <section className={styles.section}>
        <h2 className={styles.h2}>Gallery</h2>
        <div className={styles.gallery}>
          {(gallery.length ? gallery : [
            'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1521417531039-73f0e3eaf2ab?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1521417531190-500c5ba7b39a?w=1200&auto=format&fit=crop',
          ]).slice(0, limits.maxGallery).map((src, i) => (
            <div key={i} className={styles.galleryItem}>
              <img src={src} alt={`gallery-${i}`} className={styles.galleryImage} />
            </div>
          ))}

          {galleryTruncated && (
            <div className={`${styles.galleryGate} ${styles.soft}`}>
              <div className={styles.gateMsg}>
                <p>Showing {gallery.length} of {galleryAll.length} photos.</p>
                <Link to="/pricing" className={styles.gateBtn}>Upgrade to show more</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
