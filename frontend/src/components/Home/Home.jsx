import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaBolt, FaChartLine, FaArrowUp, FaArrowDown,
  FaTrophy, FaUserFriends, FaBuilding
} from 'react-icons/fa';

import './Home.css';
import { supabase } from '../../supabaseClient.js';
import heroImg from '../../assets/hero-img.png';
import padelBg2 from '../../assets/padel-bg2.jpg';
import bronzeBadge from '../../assets/badge-bronze.png';
import silverBadge from '../../assets/badge-silver.png';
import goldBadge from '../../assets/badge-gold.png';

/* ------------------------------------------------------------------ */
/* Dummy fallback data so you can see the UI even with empty tables.  */
/* ------------------------------------------------------------------ */
const DUMMY_BRANDS = [
  { brand_name: 'Volt Nutrition', content: '⚡ 15% off our tournament fuel packs!', image_url: 'https://picsum.photos/seed/volt/640/360' },
  { brand_name: 'Carbon Pro Series', content: '🎾 Feather-light carbon paddles with mega pop.', image_url: 'https://picsum.photos/seed/carbon/640/360' },
  { brand_name: 'GripMax', content: '🧤 Zero-slip grips. Free pack with any tournament entry.', image_url: 'https://picsum.photos/seed/grip/640/360' },
  { brand_name: 'Hydro+ Labs', content: '💧 Hydration tabs for five-set marathons.', image_url: 'https://picsum.photos/seed/hydro/640/360' },
];

const DUMMY_BATTLES = [
  { id:'d1', time: new Date().toISOString(), matchType:'League', matchLevel:'Intermediate', scoreline:'6–4, 5–7, 10–7', team1Name:'Alex & Priya', team2Name:'Jonas & Mia', t1Delta:+18, t2Delta:-18 },
  { id:'d2', time: new Date(Date.now()-3600e3).toISOString(), matchType:'Friendly', matchLevel:'Beginner', scoreline:'6–3, 6–2', team1Name:'Kev & Lara', team2Name:'Sam & Tash', t1Delta:+8, t2Delta:-8 },
  { id:'d3', time: new Date(Date.now()-7200e3).toISOString(), matchType:'Tournament', matchLevel:'Advanced', scoreline:'7–5, 6–7, 11–9', team1Name:'Diego & Noor', team2Name:'Zac & Luca', t1Delta:+24, t2Delta:-24 },
  { id:'d4', time: new Date(Date.now()-8200e3).toISOString(), matchType:'League', matchLevel:'Intermediate', scoreline:'6–2, 6–3', team1Name:'Ruby & Chen', team2Name:'Iris & Paul', t1Delta:+10, t2Delta:-10 },
  { id:'d5', time: new Date(Date.now()-9200e3).toISOString(), matchType:'Friendly', matchLevel:'Beginner', scoreline:'4–6, 7–5, 10–6', team1Name:'Mo & Eli', team2Name:'Kate & Tom', t1Delta:+12, t2Delta:-12 },
  { id:'d6', time: new Date(Date.now()-10200e3).toISOString(), matchType:'League', matchLevel:'Advanced', scoreline:'6–7, 7–6, 11–9', team1Name:'Ana & Leo', team2Name:'Omar & Liv', t1Delta:+22, t2Delta:-22 },
];

const DUMMY_RISING = [
  { id:'c1', name:'Padel Forge', location:'Leeds, UK', avatar_url:'https://picsum.photos/seed/club1/120', recentMatches:22, newMembers:14, recentTournaments:2, momentum:22 + 14*1.5 + 2*2 },
  { id:'c2', name:'Baseline Bandidos', location:'Madrid, ES', avatar_url:'https://picsum.photos/seed/club2/120', recentMatches:17, newMembers:9,  recentTournaments:1, momentum:17 + 9*1.5 + 2 },
  { id:'c3', name:'Court Crusaders', location:'Dublin, IE', avatar_url:'https://picsum.photos/seed/club3/120', recentMatches:12, newMembers:12, recentTournaments:0, momentum:12 + 12*1.5 },
  { id:'c4', name:'Smash City', location:'Austin, US', avatar_url:'https://picsum.photos/seed/club4/120', recentMatches:28, newMembers:6,  recentTournaments:3, momentum:28 + 6*1.5 + 6 },
  { id:'c5', name:'TopSpin Collective', location:'Berlin, DE', avatar_url:'https://picsum.photos/seed/club5/120', recentMatches:9,  newMembers:5,  recentTournaments:0, momentum:9 + 5*1.5 },
  { id:'c6', name:'Orange Court', location:'Stockholm, SE', avatar_url:'https://picsum.photos/seed/club6/120', recentMatches:16, newMembers:10, recentTournaments:1, momentum:16 + 10*1.5 + 2 },
];

/* UI constants */
const BATTLES_PAGE = 6;          // visible at first
const BATTLES_LOAD_STEP = 6;     // "Show more" adds this many

/* Helpers */
const fmtTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' });

export default function Home() {
  /* counts + lists */
  const [gauges, setGauges] = useState({ players:0, clubs:0, tournaments:0 });
  const [brands, setBrands] = useState([]);
  const [recentBattles, setRecentBattles] = useState([]);
  const [risingClubs, setRisingClubs] = useState([]);

  /* ui state */
  const [showCount, setShowCount] = useState(BATTLES_PAGE);
  const [loadingBattles, setLoadingBattles] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);

  /* hero slider */
  const navigate = useNavigate();
  const heroTrackRef = useRef(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const hoveringRef = useRef(false);
  const autoRef = useRef(null);

  const heroSlides = useMemo(() => ([
    {
      title: 'United Padel',
      line2: 'Making Matches Easy — Making Wins Count.',
      text: 'Submit a result in seconds. We handle the admin, Elo, and hype.',
      primary: { text:'Submit Match', to:'/submit-match' },
      secondary: { text:'View Rankings', to:'/leaderboard' },
    },
    {
      title: 'Climb the Elo Ladder',
      line2: 'Every Rally Matters.',
      text: 'Win more. Beat higher seeds. Level up faster.',
      primary: { text:'See Leaderboard', to:'/leaderboard' },
      secondary: { text:'How Elo Works', to:'/about' },
    },
    {
      title: 'Tournaments',
      line2: 'Compete Locally — Rank Nationally.',
      text: 'Join brackets, rack up points, unlock badges.',
      primary: { text:'Explore Tournaments', to:'/tournaments' },
      secondary: { text:'Memberships', to:'/subscriptions' },
    },
  ]), []);

  /* ----------------------- data ----------------------- */
  useEffect(() => {
    (async () => {
      // brand posts
      setLoadingBrands(true);
      const { data: brandData } = await supabase
        .from('brand_posts')
        .select('id, brand_name, content, image_url, created_at')
        .order('created_at', { ascending:false })
        .limit(12);
      setBrands(brandData?.length ? brandData : DUMMY_BRANDS);
      setLoadingBrands(false);

      // counts
      const [{ count: players }, { count: clubs }, { count: tourns }] = await Promise.all([
        supabase.from('profiles').select('*', { head:true, count:'exact' }),
        supabase.from('clubs').select('*', { head:true, count:'exact' }),
        supabase.from('tournaments').select('*', { head:true, count:'exact' }),
      ]);
      setGauges({ players:players||0, clubs:clubs||0, tournaments:tourns||0 });

      // recent battles
      setLoadingBattles(true);
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id, played_at, created_at, status, match_type, match_level, score, set1_score, set2_score, set3_score,
          match_players ( user_id, team_number, profiles ( username ) ),
          rating_changes ( user_id, delta )
        `)
        .order('played_at', { ascending:false })
        .limit(30);

      if (matches?.length) {
        const rows = matches.map(m => {
          const when = m.played_at || m.created_at;
          const scoreline = m.score || [m.set1_score, m.set2_score, m.set3_score].filter(Boolean).join(', ');
          const players = (m.match_players||[]).map(mp => ({ team: mp.team_number, name: mp.profiles?.username||'Player', id: mp.user_id }));
          const team1 = players.filter(p => p.team === 1);
          const team2 = players.filter(p => p.team === 2);
          const name = (arr) => arr.map(p => p.name).join(' & ') || '—';
          const rc = new Map((m.rating_changes||[]).map(r => [r.user_id, Number(r.delta||0)]));
          const t1Delta = team1.reduce((a,p)=>a+(rc.get(p.id)||0),0);
          const t2Delta = team2.reduce((a,p)=>a+(rc.get(p.id)||0),0);
          return {
            id: m.id, time: when, matchType: m.match_type, matchLevel: m.match_level,
            status: m.status, scoreline, team1Name: name(team1), team2Name: name(team2),
            t1Delta, t2Delta
          };
        });
        setRecentBattles(rows);
      } else {
        setRecentBattles(DUMMY_BATTLES);
      }
      setLoadingBattles(false);

      // clubs on the rise
      setLoadingClubs(true);
      const { data: clubsRows } = await supabase
        .from('clubs')
        .select('id, name, location, avatar_url, created_at')
        .limit(18);

      if (!clubsRows?.length) {
        setRisingClubs(DUMMY_RISING);
      } else {
        const now = new Date();
        const d30 = new Date(now); d30.setDate(now.getDate()-30);
        const d60 = new Date(now); d60.setDate(now.getDate()-60);
        const d30ISO = d30.toISOString();
        const d60ISO = d60.toISOString();

        const results = [];
        for (const club of clubsRows) {
          const { count:newMembers=0 } = await supabase
            .from('profiles').select('id', { head:true, count:'exact' })
            .eq('club_id', club.id).gte('created_at', d30ISO);
          const { data: ids } = await supabase.from('profiles').select('id').eq('club_id', club.id);
          const memberIds = (ids||[]).map(x=>x.id);
          let recentMatches = 0;
          if (memberIds.length) {
            const { data: mp } = await supabase
              .from('match_players')
              .select('match_id, created_at')
              .in('user_id', memberIds)
              .gte('created_at', d30ISO)
              .limit(1000);
            recentMatches = new Set((mp||[]).map(r=>r.match_id)).size;
          }
          let recentTournaments = 0;
          if (memberIds.length) {
            const { count:tCount=0 } = await supabase
              .from('tournaments').select('id', { head:true, count:'exact' })
              .in('creator_id', memberIds).gte('created_at', d60ISO);
            recentTournaments = tCount || 0;
          }
          const momentum = recentMatches*1 + newMembers*1.5 + recentTournaments*2;
          results.push({ ...club, recentMatches, newMembers, recentTournaments, momentum });
        }
        results.sort((a,b)=>b.momentum-a.momentum);
        setRisingClubs(results.slice(0,6));
      }
      setLoadingClubs(false);
    })();
  }, []);

  /* ----------------------- hero slider ----------------------- */
  const scrollToIndex = useCallback((idx) => {
    const el = heroTrackRef.current;
    if (!el) return;
    const n = heroSlides.length;
    const wrapped = ((idx % n) + n) % n;
    el.scrollTo({ left: wrapped * el.clientWidth, behavior: 'smooth' });
    setHeroIdx(wrapped);
  }, [heroSlides.length]);

  const goNext = useCallback(() => scrollToIndex(heroIdx + 1), [heroIdx, scrollToIndex]);
  const goPrev = useCallback(() => scrollToIndex(heroIdx - 1), [heroIdx, scrollToIndex]);

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (!hoveringRef.current) goNext();
    }, 5600);
    return () => clearInterval(autoRef.current);
  }, [goNext]);

  const handleHeroScroll = () => {
    const el = heroTrackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setHeroIdx(idx);
  };

  /* ----------------------- render ----------------------- */
  const visibleBattles = recentBattles.slice(0, showCount);
  const canShowMore = showCount < recentBattles.length;

  return (
    <div className="home">
      {/* HERO */}
      <section
        className="hero"
        style={{ backgroundImage:`url(${heroImg})` }}
        onMouseEnter={() => (hoveringRef.current = true)}
        onMouseLeave={() => (hoveringRef.current = false)}
      >
        <div className="hero-mask" />
        <div className="hero-track" ref={heroTrackRef} onScroll={handleHeroScroll} aria-label="Hero slides">
          {heroSlides.map((s, i) => (
            <div className="hero-slide snap" key={i}>
              <motion.div
                className="hero-card"
                initial={{ opacity:0, y:18 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, amount:.6 }}
                transition={{ duration:.45 }}
              >
                <h1 className="hero-h1">{s.title}</h1>
                <h2 className="hero-h2">{s.line2}</h2>
                <p className="hero-tag">{s.text}</p>
                <div className="hero-cta">
                  <button onClick={() => navigate(s.primary.to)} className="btn btn-primary">{s.primary.text}</button>
                  <Link to={s.secondary.to} className="btn btn-ghost">{s.secondary.text}</Link>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        <div className="hero-dots" role="tablist" aria-label="Hero pagination">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i===heroIdx}
              className={`dot ${i===heroIdx?'active':''}`}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
        <button className="hero-arrow left" aria-label="Previous" onClick={goPrev}>‹</button>
        <button className="hero-arrow right" aria-label="Next" onClick={goNext}>›</button>
      </section>

      {/* CONTENT */}
      <div className="home-lower" style={{ backgroundImage:`url(${padelBg2})` }}>
        {/* About + Elo */}
        <section className="section-wrapper about-elo">
          <div className="about-grid">
            <motion.div className="about-card"
              initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:.5 }}>
              <h3>Who We Are</h3>
              <p>United Padel brings players, clubs and fans together with an esports-grade gamified experience. Track progress, celebrate milestones, climb the ladder.</p>
            </motion.div>
            <motion.div className="about-card"
              initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:.5 }}>
              <h3>How Elo Works</h3>
              <p>Every rally nudges your rating. Beat stronger opponents, gain more. Tournaments multiply gains; inactivity slowly tapers points. Start at 1000 — rise from there.</p>
              <Link to="/leaderboard" className="link-underline">View Leaderboard →</Link>
            </motion.div>
          </div>
        </section>

        <div className="section-divider" />

        {/* Brand Partners */}
        <section className="section-wrapper partners">
          <h3 className="section-title">Brand Partners</h3>

          {loadingBrands ? (
            <div className="brand-grid">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="brand-card skeleton" />)}
            </div>
          ) : (
            <div className={`brand-grid ${brands.length<4 ? 'is-centered' : ''}`}>
              {(brands.length ? brands : DUMMY_BRANDS).map((b, i) => (
                <motion.article key={b.id || i} className="brand-card"
                  initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
                  {b.image_url && <img src={b.image_url} alt={b.brand_name} loading="lazy" />}
                  <div className="brand-meta">
                    <h4>{b.brand_name}</h4>
                    <p>{b.content}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <div className="section-divider" />

        {/* Memberships */}
        <section className="section-wrapper plans">
          <h3 className="section-title">Membership Tiers</h3>
          <div className="plan-grid">
            {[{title:'Basic',img:bronzeBadge,desc:'All the essentials to start tracking.'},
              {title:'Plus',img:silverBadge,desc:'Deeper stats and priority support.'},
              {title:'Elite',img:goldBadge,desc:'Max data, VIP features, early access.'}]
              .map((p,i)=>(
                <motion.div key={i} className="plan-card"
                  initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
                  <img src={p.img} alt={`${p.title} badge`} className="plan-badge" />
                  <h4>{p.title}</h4>
                  <p className="plan-desc">{p.desc}</p>
                  <Link className="btn btn-light" to="/subscriptions">See details →</Link>
                </motion.div>
            ))}
          </div>
        </section>

        <div className="section-divider" />

        {/* Recent Battles */}
        <section className="section-wrapper battles">
          <div className="section-topline">
            <h3 className="section-title with-icon"><FaBolt /> Recent Battles</h3>
            <Link to="/leaderboard" className="link-underline">See full rankings →</Link>
          </div>

          {loadingBattles ? (
            <div className="battle-list">
              {Array.from({ length: BATTLES_PAGE }).map((_,i)=> <div key={i} className="battle-card skeleton" />)}
            </div>
          ) : visibleBattles.length === 0 ? (
            <p className="empty">No matches yet — be the first to submit!</p>
          ) : (
            <>
              <ul className="battle-list">
                {visibleBattles.map(m => (
                  <motion.li key={m.id} className="battle-card"
                    initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
                    <div className="battle-main">
                      <div className="teams">
                        <span className="team">{m.team1Name}</span>
                        <span className="vs">vs</span>
                        <span className="team">{m.team2Name}</span>
                      </div>
                      <div className="meta">
                        {m.scoreline && <span className="score">{m.scoreline}</span>}
                        {m.matchType && <span className="type">{m.matchType}</span>}
                        {m.matchLevel && <span className="chip">{m.matchLevel}</span>}
                      </div>
                      <div className="elo">
                        <span className={`delta ${m.t1Delta>=0?'up':'down'}`} title="Team 1 Elo Δ">
                          {m.t1Delta>=0 ? <FaArrowUp/> : <FaArrowDown/>} {Math.abs(Math.round(m.t1Delta))}
                        </span>
                        <span className="slash">/</span>
                        <span className={`delta ${m.t2Delta>=0?'up':'down'}`} title="Team 2 Elo Δ">
                          {m.t2Delta>=0 ? <FaArrowUp/> : <FaArrowDown/>} {Math.abs(Math.round(m.t2Delta))}
                        </span>
                      </div>
                    </div>
                    <div className="time">{fmtTime(m.time)}</div>
                  </motion.li>
                ))}
              </ul>

              {canShowMore && (
                <div className="load-more">
                  <button className="btn btn-ghost" onClick={() => setShowCount(c => c + BATTLES_LOAD_STEP)}>
                    Show more
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Clubs on the Rise */}
        <section className="section-wrapper rising">
          <div className="section-topline">
            <h3 className="section-title with-icon"><FaChartLine /> Clubs on the Rise</h3>
            <Link to="/subscriptions" className="link-underline">Why clubs join →</Link>
          </div>

          {loadingClubs ? (
            <div className="rising-grid">
              {Array.from({ length: 6 }).map((_,i)=> <div key={i} className="rise-card skeleton" />)}
            </div>
          ) : risingClubs.length === 0 ? (
            <p className="empty">No active clubs — your club could be the first.</p>
          ) : (
            <div className="rising-grid">
              {risingClubs.map(c => (
                <motion.article key={c.id} className="rise-card"
                  initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
                  <div className="rise-head">
                    {c.avatar_url
                      ? <img className="club-avatar" src={c.avatar_url} alt={c.name} />
                      : <div className="club-avatar fallback">{c.name?.[0]?.toUpperCase()||'C'}</div>}
                    <div className="rise-title">
                      <h4>{c.name}</h4>
                      <span className="sub">{c.location||''}</span>
                    </div>
                    <span className="chip rise"><FaArrowUp/> {Math.round(c.momentum)}</span>
                  </div>
                  <div className="rise-stats">
                    <div className="rs"><span className="rs-num">{c.recentMatches}</span><span className="rs-label">Matches (30d)</span></div>
                    <div className="rs"><span className="rs-num">{c.newMembers}</span><span className="rs-label">New members</span></div>
                    <div className="rs"><span className="rs-num">{c.recentTournaments}</span><span className="rs-label">Tournaments (60d)</span></div>
                  </div>
                  <div className="rise-actions">
                    <Link to={`/clubs/${c.id}`} className="btn btn-light">View Club →</Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* Count snapshot (compact, centered) */}
        <section className="section-wrapper snapshot">
          <h3 className="section-title">United Padel at a Glance</h3>
          <div className="podium">
            <div className="podium-card second">
              <span className="stat-icon"><FaBuilding size={26}/></span>
              <h4>{gauges.clubs.toLocaleString()}</h4><p>Clubs</p>
            </div>
            <div className="podium-card first">
              <span className="stat-icon"><FaUserFriends size={26}/></span>
              <h4>{gauges.players.toLocaleString()}</h4><p>Players</p>
            </div>
            <div className="podium-card third">
              <span className="stat-icon"><FaTrophy size={26}/></span>
              <h4>{gauges.tournaments.toLocaleString()}</h4><p>Tournaments</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
