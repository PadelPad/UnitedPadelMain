// /src/components/Profile/MyProfile.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

import PlayerCardFront from "./PlayerCardFront";
import SocialLinks from "./SocialLinks";
import BadgeScrapbook from "./BadgeScrapbook";

import "./Profile.css";
import "./PlayerCard.css";
import padelBG2 from "../../assets/padel-bg2.jpg";

// ---------------- helpers ----------------
const toNumber = (v, fallback = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;
const clampPct = (n) => Math.min(100, Math.max(0, n));

function calcLevel(xp, levelSize = 500) {
  const _xp = toNumber(xp, 0);
  const level = Math.floor(_xp / levelSize);
  const xpInto = _xp % levelSize;
  const pct = clampPct((xpInto / levelSize) * 100);
  return { level, levelSize, xpInto, pct };
}

function computeStreak(bubbles = []) {
  // bubbles newest → oldest
  let s = 0;
  for (const b of bubbles) {
    if (b === "W") s += 1;
    else break;
  }
  return s;
}

// ---------------- component --------------
export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [bubbles, setBubbles] = useState([]); // ['W','L',...]
  const [latestBadge, setLatestBadge] = useState(null); // { title, description, awarded_at }

  const [openBadges, setOpenBadges] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) auth
      const { data: ures, error: aerr } = await supabase.auth.getUser();
      if (aerr || !ures?.user) throw new Error("Not signed in.");
      const userId = ures.user.id;

      // 2) profile
      const { data: prof, error: perr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (perr) throw perr;

      const safe = {
        ...prof,
        rating: toNumber(prof?.rating, 1000),
        xp: Math.max(0, toNumber(prof?.xp, 0)),
        win_percentage: toNumber(prof?.win_percentage, 0),
        streak: toNumber(prof?.streak, 0),
        badges_count: toNumber(prof?.badges_count, 0),
      };
      setProfile(safe);

      // 3) recent results via rating_changes (avoids match_players & joins)
      const { data: rc, error: rcErr } = await supabase
        .from("rating_changes")
        .select("delta, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (rcErr) throw rcErr;

      const bubblesArr = (rc || [])
        .map((r) => {
          const d = toNumber(r.delta, 0);
          if (d > 0) return "W";
          if (d < 0) return "L";
          return null; // ignore neutrals
        })
        .filter(Boolean);

      setBubbles(bubblesArr);

      // 4) latest earned badge (no join to avoid RLS recursion)
      const { data: ub, error: ubErr } = await supabase
        .from("user_badges")
        .select("badge_id, awarded_at")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false })
        .limit(1);
      if (ubErr) throw ubErr;

      if (ub && ub.length) {
        const badgeId = ub[0].badge_id;
        const { data: badge, error: bErr } = await supabase
          .from("badges")
          .select("title, description")
          .eq("id", badgeId)
          .single();
        if (!bErr && badge) {
          setLatestBadge({
            title: badge.title || "Badge unlocked",
            description: badge.description || "",
            awarded_at: ub[0].awarded_at,
          });
        } else {
          setLatestBadge(null);
        }
      } else {
        setLatestBadge(null);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const levelInfo = useMemo(
    () => calcLevel(profile?.xp ?? 0, 500),
    [profile?.xp]
  );
  const computedStreak = useMemo(() => computeStreak(bubbles), [bubbles]);

  // -------------- UI ----------------------
  if (loading) {
    return (
      <div
        className="profilePage"
        style={{
          backgroundImage: `url(${padelBG2})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
      >
        <div className="loaderWrapper">
          <div className="custom-loader">Loading profile…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorWrapper">
        <h2 className="errorTitle">We hit a snag</h2>
        <p className="errorText">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="errorWrapper">
        <h2 className="errorTitle">Profile not found</h2>
        <p className="errorText">
          Please complete your registration or contact support.
        </p>
      </div>
    );
  }

  return (
    <div
      className="profilePage"
      style={{
        backgroundImage: `url(${padelBG2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header className="profileHeader glassyBox">
        <h1 className="mainHeading">
          Welcome back, {profile.username || "Player"}!
        </h1>
        <div className="subHeading">
          {(profile.subscription_tier || "free").toUpperCase()} MEMBER
        </div>

        <div className="chipsRow" role="list" aria-label="Profile meta">
          <span className="chip" role="listitem">
            <span className="chipIcon" aria-hidden>
              📍
            </span>
            {profile.region || "Unknown"}
          </span>
          <span className="chip" role="listitem">
            <span className="chipIcon" aria-hidden>
              🏟
            </span>
            {profile.club || "No Club"}
          </span>
          <span className="chip" role="listitem" title="Current streak">
            <span className="chipIcon" aria-hidden>
              🔥
            </span>
            {computedStreak} streak
          </span>
        </div>
      </header>

      {/* Layout */}
      <div className="profileContentGrid">
        {/* Left: sticky player card */}
        <aside className="profileLeftCol">
          <div className="cardWithOverlay">
            <PlayerCardFront player={profile} />
            <button
              className="openBadgesPill"
              onClick={() => setOpenBadges(true)}
              title="Open your badges scrapbook"
            >
              🏅 Badges
            </button>
          </div>
        </aside>

        {/* Right: content */}
        <main className="profileRightCol">
          {/* Progress */}
          <section className="glassyBox statsBox">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Progress</h2>
              <div className="sectionMeta">
                Level {levelInfo.level} • XP {levelInfo.xpInto} /{" "}
                {levelInfo.levelSize}
              </div>
            </div>
            <div
              className="progressBarOuter"
              aria-label="XP progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(levelInfo.pct)}
              role="progressbar"
            >
              <div
                className="progressBarInner"
                style={{ width: `${levelInfo.pct}%` }}
              />
              <div className="progressTicks">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </section>

          {/* Two-up row */}
          <div className="twoUpRow">
            {/* Recent Matches */}
            <section className="glassyBox statsBox">
              <h2 className="sectionTitle">Recent Matches</h2>
              <div className="matchBubbleRow" aria-label="Recent results">
                {bubbles.length ? (
                  bubbles.map((r, i) => (
                    <span
                      key={`${r}-${i}`}
                      className={`matchBubble ${r === "W" ? "win" : "loss"}`}
                      title={r === "W" ? "Win" : "Loss"}
                      aria-label={r === "W" ? "Win" : "Loss"}
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <div className="emptyState">
                    <p>No recent matches yet.</p>
                    <Link to="/submit-match" className="ctaLink">
                      ⚔️ Challenge someone nearby
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Latest Badge */}
            <section className="glassyBox statsBox">
              <h2 className="sectionTitle">Latest Badge</h2>
              {latestBadge ? (
                <div className="badgePreviewBox" aria-live="polite">
                  <div className="badgeRow">
                    <span className="badgeEmoji" aria-hidden>
                      🏅
                    </span>
                    <h3 className="badgeTitle">{latestBadge.title}</h3>
                  </div>
                  <p className="smallText">{latestBadge.description}</p>
                  <div className="sparkleHint">
                    Earn more by playing verified matches.
                  </div>
                </div>
              ) : (
                <div className="emptyState">
                  <p>No badges yet. Play matches to start unlocking!</p>
                  <button
                    className="editButton"
                    onClick={() => setOpenBadges(true)}
                  >
                    View all badges
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Socials + Edit */}
          <section className="glassyBox statsBox">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Your Connections</h2>
            </div>
            <SocialLinks
              links={{
                instagram: profile.instagram_url,
                facebook: profile.facebook_url,
                website: profile.website_url,
              }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link to="/account-settings">
                <button className="editButton">✏️ Edit Profile</button>
              </Link>
              <Link to="/submit-match">
                <button className="editButton">➕ Submit Match</button>
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* Badges Scrapbook modal */}
      <BadgeScrapbook
        isOpen={openBadges}
        onClose={() => setOpenBadges(false)}
        entityType="user"
        entityId={profile.id}
        subscriptionTier={profile.subscription_tier}
      />
    </div>
  );
}
