// /src/components/SubmitMatch/SubmitMatch.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient.js";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import MiniCard from "./MiniCard";
import padelBg from "../../assets/padel-bg.jpg";
import "./SubmitMatch.css";

const DEBOUNCE_MS = 250;

// Prefer auth UID if present; fallback to row id (used only for keys)
const uidOf = (p) => (p?.user_id || p?.id || "").toString();

export default function SubmitMatch() {
  const [step, setStep] = useState(1);

  // data
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // selection
  const [matchType, setMatchType] = useState("doubles");
  const [matchLevel, setMatchLevel] = useState("friendly");
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);

  // scores
  const [setScores, setSetScores] = useState([
    { team1: "", team2: "" },
    { team1: "", team2: "" },
    { team1: "", team2: "" },
  ]);
  const [showSet3, setShowSet3] = useState(false);
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split("T")[0]);
  const [winner, setWinner] = useState("");

  // summary
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [eloSummary, setEloSummary] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // auth
  const [user, setUser] = useState(null);
  const [meRow, setMeRow] = useState(null); // <- definitive profile row for current user

  // ui
  const [highlightIndex, setHighlightIndex] = useState(0);
  const searchInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // ========= Load session + players =========
  useEffect(() => {
    (async () => {
      const [{ data: sessionData }, { data: userData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);
      const authed = userData?.user ?? sessionData?.session?.user ?? null;
      setUser(authed);

      const { data: profs } = await supabase
        .from("profiles")
        .select("id,user_id,username,rating,avatar_url,badges_count,matches_played")
        .order("rating", { ascending: false })
        .limit(200);
      setAllPlayers(profs || []);
      setSearchResults([]);
    })();
  }, []);

  // ========= Fetch the exact profile row for the signed-in user =========
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Try direct match on user_id
      let { data: me1 } = await supabase
        .from("profiles")
        .select("id,user_id,username,rating,avatar_url,badges_count,matches_played")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fallback: some schemas use profiles.id == auth.users.id
      if (!me1) {
        const { data: me2 } = await supabase
          .from("profiles")
          .select("id,user_id,username,rating,avatar_url,badges_count,matches_played")
          .eq("id", user.id)
          .maybeSingle();
        me1 = me2 ?? null;
      }

      // Final fallback: build a minimal synthetic row if none exists
      if (!me1) {
        const fallbackName =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          (user.email ? user.email.split("@")[0] : "me");
        me1 = {
          id: user.id,
          user_id: user.id,
          username: fallbackName,
          rating: 1000,
          avatar_url: user.user_metadata?.avatar_url || null,
          badges_count: 0,
          matches_played: 0,
          __synthetic: true,
        };
      }

      setMeRow(me1);
    })();
  }, [user]);

  // ========= Strong identity comparator for "is the same person as me?" =========
  const meUID = user?.id || null;
  const isMePlayer = (p) => {
    if (!p || !user) return false;
    const pid = (p.id || "").toString();
    const puid = (p.user_id || "").toString();
    // direct id matches
    if (puid && puid === meUID) return true;
    if (pid === meUID) return true;
    // match profile row id if we have it
    if (meRow?.id && pid === (meRow.id || "").toString()) return true;
    // last-resort: username match (case-insensitive)
    if (
      meRow?.username &&
      p?.username &&
      meRow.username.trim().toLowerCase() === p.username.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // ========= Auto-seed me into Team 1 (using the DB row) =========
  useEffect(() => {
    if (!user || !meRow) return;
    const cap = matchType === "singles" ? 1 : 2;
    const inT1 = team1.some(isMePlayer);
    const inT2 = team2.some(isMePlayer);

    if (!inT1 && !inT2) {
      // prefer Team 1
      setTeam1((prev) => {
        if (prev.length < cap) return [...prev, meRow];
        // replace first slot if full
        return [meRow, ...prev.slice(1, cap)];
      });
    }

    // on type change, enforce caps & keep me on Team 1
    setTeam1((prev) => {
      let next = prev.slice(0, cap);
      if (!next.some(isMePlayer)) {
        if (next.length < cap) next = [...next, meRow];
        else next = [meRow, ...next.slice(1)];
      }
      return next;
    });
    setTeam2((prev) => prev.slice(0, cap));
  }, [user, meRow, matchType]); // re-run on type change or meRow resolve

  // ========= Debounced server-side search =========
  useEffect(() => {
    const q = (searchQuery || "").trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const h = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,username,rating,avatar_url,badges_count,matches_played")
        .ilike("username", `%${q}%`)
        .limit(200);
      if (!error) setSearchResults(data || []);
    }, DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [searchQuery]);

  // ========= Step focus/scroll =========
  useEffect(() => {
    if (step === 2) setTimeout(() => searchInputRef.current?.focus(), 60);
    document.querySelector(".submit-match-container")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [step]);

  // ========= Score helpers =========
  const clamp0_7 = (n) => {
    const x = parseInt(String(n).replace(/[^\d-]/g, ""), 10);
    if (Number.isNaN(x)) return "";
    return Math.min(7, Math.max(0, x));
  };

  const isScoreValid = (a, b) => {
    a = Number(a);
    b = Number(b);
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    if ((a === 7 && (b === 5 || b === 6)) || (b === 7 && (a === 5 || a === 6))) return true;
    if ((a >= 6 && a - b >= 2) || (b >= 6 && b - a >= 2)) return true;
    return false;
  };

  const computeWinner = (scores, use3) => {
    const s = scores.map((x) => ({ t1: Number(x.team1), t2: Number(x.team2) }));
    const played = (use3 ? s.slice(0, 3) : s.slice(0, 2)).filter(
      (x) => !Number.isNaN(x.t1) && !Number.isNaN(x.t2) && isScoreValid(x.t1, x.t2)
    );
    if (played.length < (use3 ? 3 : 2)) return "";
    const t1wins = played.reduce((acc, x) => acc + (x.t1 > x.t2 ? 1 : 0), 0);
    const t2wins = played.length - t1wins;
    return t1wins > t2wins ? "1" : "2";
  };

  const formatScoreString = () => {
    const cap = showSet3 ? 3 : 2;
    return Array.from({ length: cap })
      .map((_, i) => {
        const s = setScores[i] || { team1: 0, team2: 0 };
        return `${parseInt(s.team1 || 0)}-${parseInt(s.team2 || 0)}`;
      })
      .join(", ");
  };

  // ========= Score change =========
  const handleScoreChange = (idx, team, rawVal) => {
    const val = clamp0_7(rawVal);
    setSetScores((prev) => {
      const updated = [...prev];
      updated[idx] = { ...(updated[idx] || { team1: "", team2: "" }), [team]: val };

      if (
        updated[0]?.team1 !== "" &&
        updated[0]?.team2 !== "" &&
        updated[1]?.team1 !== "" &&
        updated[1]?.team2 !== ""
      ) {
        const t1winsFirstTwo =
          (Number(updated[0].team1) > Number(updated[0].team2) ? 1 : 0) +
          (Number(updated[1].team1) > Number(updated[1].team2) ? 1 : 0);
        setShowSet3(t1winsFirstTwo === 1);
      } else {
        setShowSet3(false);
      }

      const auto = computeWinner(updated, showSet3);
      if (auto) setWinner(auto);

      return updated;
    });
  };

  // ========= selection helpers =========
  const cap = matchType === "singles" ? 1 : 2;
  const alreadyPicked = (player) =>
    [...team1, ...team2].some((p) => uidOf(p) === uidOf(player));

  const handlePlayerSelect = (team, player) => {
    if (isMePlayer(player)) return; // never select me from the grid
    if (alreadyPicked(player)) return;
    if (team === 1 && team1.length < cap) setTeam1([...team1, player]);
    if (team === 2 && team2.length < cap) setTeam2([...team2, player]);
  };

  const handlePlayerRemove = (team, idOrUid) => {
    const byUid = (p) => uidOf(p) !== idOrUid;
    if (team === 1) setTeam1(team1.filter(byUid));
    if (team === 2) setTeam2(team2.filter(byUid));
  };

  const moveToOtherTeam = (player, from) => {
    if (isMePlayer(player)) return; // don't move me via ⇄
    if (from === 1 && team2.length < cap) {
      setTeam1(team1.filter((p) => uidOf(p) !== uidOf(player)));
      setTeam2([...team2, player]);
    } else if (from === 2 && team1.length < cap) {
      setTeam2(team2.filter((p) => uidOf(p) !== uidOf(player)));
      setTeam1([...team1, player]);
    }
  };

  // ========= displayable players (exclude me) =========
  const baseList = searchQuery.trim() ? searchResults || [] : allPlayers || [];
  const teamsFull = team1.length === cap && team2.length === cap;
  const displayedPlayers = teamsFull
    ? []
    : baseList.filter((p) => !alreadyPicked(p) && !isMePlayer(p));

  // ========= keyboard nav =========
  const handleKeyDown = (e) => {
    if (!displayedPlayers.length) return;
    if (e.key === "ArrowDown")
      setHighlightIndex((prev) => (prev + 1) % displayedPlayers.length);
    else if (e.key === "ArrowUp")
      setHighlightIndex((prev) => (prev - 1 + displayedPlayers.length) % displayedPlayers.length);
    else if (e.key === "Enter") {
      const selected = displayedPlayers[highlightIndex];
      if (selected)
        handlePlayerSelect(team1.length <= team2.length ? 1 : 2, selected);
    }
  };

  // ========= Resolve/auth-UIDs for both teams =========
  const resolveTeamUIDs = async (team) => {
    const ids = await Promise.all(
      team.map(async (p) => {
        const guess = uidOf(p);
        if (guess) return guess;
        if (p?.id) {
          const { data } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("id", p.id)
            .maybeSingle();
          if (data?.user_id) return data.user_id;
        }
        return null;
      })
    );
    const missing = team.filter((_, i) => !ids[i]);
    return { ids, missing };
  };

  // ========= SUBMIT =========
  const handleSubmit = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData?.session?.user;
    if (!sessionUser) {
      alert("You must be signed in.");
      return;
    }

    // Ensure I'm on a team just before submit
    const inT1 = team1.some(isMePlayer);
    const inT2 = team2.some(isMePlayer);
    if (!inT1 && !inT2 && meRow) {
      const capNow = matchType === "singles" ? 1 : 2;
      if (team1.length < capNow) {
        setTeam1((prev) => [...prev, meRow].slice(0, capNow));
      } else {
        setTeam1((prev) => [meRow, ...prev.filter((p) => !isMePlayer(p))].slice(0, capNow));
      }
      alert("We've added you to Team 1. Please submit again.");
      return;
    }

    // Validate scores
    const [s1, s2, s3] = setScores;
    const firstTwoValid =
      s1.team1 !== "" &&
      s1.team2 !== "" &&
      s2.team1 !== "" &&
      s2.team2 !== "" &&
      isScoreValid(s1.team1, s1.team2) &&
      isScoreValid(s2.team1, s2.team2);
    if (!firstTwoValid) {
      alert("Invalid set scores. Please enter two valid sets (padel rules).");
      return;
    }
    if (showSet3 && !(s3.team1 !== "" && s3.team2 !== "" && isScoreValid(s3.team1, s3.team2))) {
      alert("Invalid third set score.");
      return;
    }

    // Team sizes
    if (team1.length !== cap || team2.length !== cap) {
      alert(`Incorrect team sizes for ${matchType}.`);
      return;
    }

    // Resolve UIDs
    const [{ ids: t1UIDs, missing: miss1 }, { ids: t2UIDs, missing: miss2 }] =
      await Promise.all([resolveTeamUIDs(team1), resolveTeamUIDs(team2)]);
    if (miss1.length || miss2.length) {
      const names = (arr) => arr.map((p) => p.username || "(unknown)").join(", ");
      const parts = [];
      if (miss1.length) parts.push(`Team 1 needs accounts: ${names(miss1)}`);
      if (miss2.length) parts.push(`Team 2 needs accounts: ${names(miss2)}`);
      alert("Some players don’t have linked accounts yet.\n\n" + parts.join("\n"));
      return;
    }

    // Winner
    const auto = computeWinner(setScores, showSet3);
    const winnerTeam = parseInt((winner || auto || ""), 10);
    if (winnerTeam !== 1 && winnerTeam !== 2) {
      alert("Please select the winning team.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        p_match_type: matchType,
        p_match_level: matchLevel,
        p_score: formatScoreString(),
        p_played_at: `${playedAt}T00:00:00Z`,
        p_team1_ids: t1UIDs,
        p_team2_ids: t2UIDs,
        p_winner_team: winnerTeam,
      };

      const { data, error } = await supabase.rpc("submit_match_tx", payload);
      if (error) {
        alert(
          `${error.code ?? ""} ${error.message}\n` +
            `${error.details ?? ""}\n` +
            `${error.hint ?? ""}`
        );
        return;
      }

      const newMatchId = data?.match_id ?? null;
      if (newMatchId) {
        const setsArr = (showSet3 ? [0, 1, 2] : [0, 1]).map((i) => ({
          t1: Number(setScores[i].team1),
          t2: Number(setScores[i].team2),
        }));
        await supabase
          .from("matches")
          .update({
            set1_score: `${parseInt(setScores[0].team1)}-${parseInt(setScores[0].team2)}`,
            set2_score: `${parseInt(setScores[1].team1)}-${parseInt(setScores[1].team2)}`,
            set3_score: showSet3 ? `${parseInt(setScores[2].team1)}-${parseInt(setScores[2].team2)}` : null,
            sets_json: setsArr,
          })
          .eq("id", newMatchId)
          .throwOnError();
      }

      // Elo projection (fallback)
      let projection = data?.projection;
      if (!projection) {
        const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
        const t1Avg = avg(team1.map((p) => Number(p.rating || 1000)));
        const t2Avg = avg(team2.map((p) => Number(p.rating || 1000)));
        const exp1 = 1 / (1 + Math.pow(10, (t2Avg - t1Avg) / 400));
        const K = matchLevel === "tournament" ? 50 : 32;
        const r1 = winnerTeam === 1 ? 1 : 0;
        const r2 = 1 - r1;

        const t1Delta = Math.round(K * (r1 - exp1));
        const t2Delta = Math.round(K * (r2 - (1 - exp1)));
        projection = {
          team1: team1.map((p) => ({
            id: uidOf(p),
            username: p.username,
            delta: t1Delta,
            newRating: Number(p.rating || 1000) + t1Delta,
          })),
          team2: team2.map((p) => ({
            id: uidOf(p),
            username: p.username,
            delta: t2Delta,
            newRating: Number(p.rating || 1000) + t2Delta,
          })),
        };
      }

      const summary = [...(projection.team1 || []), ...(projection.team2 || [])];
      setEloSummary(summary);
      setSummaryVisible(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      // reset UI for next match
      setStep(1);
      setTeam1([]);
      setTeam2([]);
      setSetScores([
        { team1: "", team2: "" },
        { team1: "", team2: "" },
        { team1: "", team2: "" },
      ]);
      setShowSet3(false);
      setSearchQuery("");
      setWinner("");
    } catch (e) {
      console.error(e);
      alert(e.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const liveScore = formatScoreString();

  return (
    <div
      className="submit-match-bg"
      style={{
        backgroundImage: `url(${padelBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <div
        className="submit-match-container"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-busy={submitting}
      >
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="form-wrapper">
          <div className="step-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className={`step step${step}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <h3>🎾 Choose Match Type</h3>
                    <div className="match-options">
                      <button
                        className={`option ${matchType === "singles" ? "active" : ""}`}
                        onClick={() => setMatchType("singles")}
                        type="button"
                      >
                        Singles
                      </button>
                      <button
                        className={`option ${matchType === "doubles" ? "active" : ""}`}
                        onClick={() => setMatchType("doubles")}
                        type="button"
                      >
                        Doubles
                      </button>
                    </div>
                    <h4>🏆 Match Level</h4>
                    <div className="match-options">
                      <button
                        className={`option ${matchLevel === "friendly" ? "active" : ""}`}
                        onClick={() => setMatchLevel("friendly")}
                        type="button"
                      >
                        Friendly
                      </button>
                      <button
                        className={`option ${matchLevel === "tournament" ? "active" : ""}`}
                        onClick={() => setMatchLevel("tournament")}
                        type="button"
                      >
                        Tournament
                      </button>
                    </div>
                    <div className="button-group">
                      <button className="cta-button" onClick={() => setStep(2)} type="button">
                        Next
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <h3>⚔️ Choose Your Opponents</h3>
                    <p style={{ opacity: 0.8, marginTop: -8 }}>
                      {cap === 1 ? "Pick 1 player per team." : "Pick 2 players per team."}
                    </p>

                    <div className="team-wrapper">
                      {[
                        { team: team1, label: "Team 1", id: 1 },
                        { team: team2, label: "Team 2", id: 2 },
                      ].map(({ team, label, id }) => (
                        <div className="team" key={id}>
                          <h4>
                            {label}{" "}
                            <span style={{ opacity: 0.7 }}>
                              ({team.length}/{cap})
                            </span>
                          </h4>
                          {team.map((p) => (
                            <div className="player-slot" key={uidOf(p)}>
                              {p.username}
                              <span onClick={() => handlePlayerRemove(id, uidOf(p))} title="Remove">✖</span>
                              {!isMePlayer(p) && (
                                <span onClick={() => moveToOtherTeam(p, id)} title="Move">⇄</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      className="search-bar"
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightIndex(0);
                      }}
                      ref={searchInputRef}
                    />

                    {teamsFull ? (
                      <div className="empty" style={{ marginTop: 10 }}>
                        Teams full — remove a player to change selection.
                      </div>
                    ) : (
                      <div className="player-grid">
                        {displayedPlayers.map((p, i) => (
                          <MiniCard
                            key={uidOf(p)}
                            player={p}
                            highlight={i === highlightIndex}
                            disabled={isMePlayer(p)}
                            onSelect={(sel) =>
                              handlePlayerSelect(team1.length <= team2.length ? 1 : 2, sel)
                            }
                          />
                        ))}
                        {displayedPlayers.length === 0 && (
                          <div style={{ opacity: 0.85, padding: "6px 2px" }}>
                            No players match “{searchQuery}”.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="button-group">
                      <button className="cta-button" onClick={() => setStep(1)} type="button">
                        Back
                      </button>
                      <button className="cta-button" onClick={() => setStep(3)} type="button">
                        Next
                      </button>
                    </div>
                  </>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <>
                    <h3>📋 Enter Scores</h3>
                    <input
                      type="date"
                      value={playedAt}
                      onChange={(e) => setPlayedAt(e.target.value)}
                    />

                    {Array.from({ length: showSet3 ? 3 : 2 }).map((_, idx) => (
                      <div className="set-inputs" key={idx}>
                        <input
                          type="number"
                          className="score-tile"
                          placeholder="T1"
                          value={setScores[idx]?.team1 ?? ""}
                          onChange={(e) => handleScoreChange(idx, "team1", e.target.value)}
                          min="0"
                          max="7"
                        />
                        <input
                          type="number"
                          className="score-tile"
                          placeholder="T2"
                          value={setScores[idx]?.team2 ?? ""}
                          onChange={(e) => handleScoreChange(idx, "team2", e.target.value)}
                          min="0"
                          max="7"
                        />
                      </div>
                    ))}

                    <div className="score-preview">
                      <div className="score-line">Score preview: <strong>{liveScore}</strong></div>
                      <div className="set-chips">
                        {(showSet3 ? [0,1,2] : [0,1]).map((i) => {
                          const s = setScores[i];
                          const valid = s.team1 !== "" && s.team2 !== "" && isScoreValid(s.team1, s.team2);
                          return <span key={i} className={`chip ${valid ? 'ok' : 'bad'}`}>Set {i+1}</span>;
                        })}
                      </div>
                      <div className="tiny-hints">
                        Use <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> to move between tiles.
                      </div>
                    </div>

                    <select
                      value={winner}
                      onChange={(e) => setWinner(e.target.value)}
                      style={{ marginTop: 10 }}
                    >
                      <option value="">Select Winning Team</option>
                      <option value="1">Team 1</option>
                      <option value="2">Team 2</option>
                    </select>

                    <div className="button-group">
                      <button className="cta-button" onClick={() => setStep(2)} type="button">
                        Back
                      </button>
                      <button className="cta-button" onClick={handleSubmit} disabled={submitting} type="button">
                        {submitting ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      <AnimatePresence>
        {summaryVisible && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2>✅ Match Submitted!</h2>
              <p>
                Projected rating changes
                {matchLevel === "friendly" ? " (after approvals)" : ""}:
              </p>
              <ul>
                {eloSummary.map((p) => (
                  <li key={uidOf(p)} style={{ color: p.delta >= 0 ? "green" : "red" }}>
                    {p.username}: {p.newRating} ({p.delta >= 0 ? "+" : ""}
                    {p.delta})
                  </li>
                ))}
              </ul>
              <button className="cta-button" onClick={() => setSummaryVisible(false)} type="button">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
