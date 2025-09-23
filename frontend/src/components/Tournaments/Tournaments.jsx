// src/components/Tournaments/Tournaments.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { supabase } from "../../supabaseClient.js";
import TournamentCard from "./TournamentCard";
import TournamentOverview from "./TournamentOverview";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import { generateFixtures } from "../../utils/fixtureGenerator";
import marbleImg from "./marble.jpg"; // ✅ import the marble texture
import "./Tournaments.css";

const MEMBERSHIP_LIMITS = {
  basic: 0,
  individual_plus: 1,
  club_plus: 3,
  elite: Infinity,
};

const TABS = [
  { key: "all", label: "All", icon: "🏷️" },
  { key: "upcoming", label: "Upcoming", icon: "⏳" },
  { key: "ongoing", label: "Ongoing", icon: "🔥" },
  { key: "finished", label: "Finished", icon: "🏁" },
];

export default function Tournaments({ user, membershipTier }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
    type: "knockout",
    config: {},
    poster_url: "",
  });
  const [creating, setCreating] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: true });
      if (e) setError("Failed to load tournaments.");
      else setTournaments(data || []);
      setLoading(false);
    })();
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleConfig = (e) =>
    setForm((f) => ({ ...f, config: { ...f.config, [e.target.name]: e.target.value } }));

  const uploadPoster = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCreating(true);
    const path = `posters/${uuidv4()}.${file.name.split(".").pop()}`;
    const { data, error: upErr } = await supabase.storage.from("posters").upload(path, file);
    if (!upErr) {
      const { publicURL } = supabase.storage.from("posters").getPublicUrl(data.path);
      setForm((f) => ({ ...f, poster_url: publicURL }));
    }
    setCreating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const createdCount = tournaments.filter((t) => t.creator_id === user?.id).length;
    const creationLimit = MEMBERSHIP_LIMITS[membershipTier] || 0;

    if (createdCount >= creationLimit) return;
    if (form.type === "league" && membershipTier !== "elite") {
      alert("Only Elite members can create league tournaments.");
      return;
    }

    setCreating(true);

    const { data, error: insErr } = await supabase
      .from("tournaments")
      .insert([{ ...form, creator_id: user.id }])
      .single();

    if (insErr) {
      alert("Error creating tournament");
      setCreating(false);
      return;
    }

    // Insert auto-fixtures for LEAGUE
    if (form.type === "league") {
      const { data: players } = await supabase
        .from("tournament_players")
        .select("user_id")
        .eq("tournament_id", data.id);

      if (players && players.length >= 2) {
        const fixtures = generateFixtures(players, form.config.format || "singles");

        const insertData = fixtures.flatMap((f) =>
          f.matches.map((m) => ({
            id: m.id,
            tournament_id: data.id,
            round: m.round,
            team1_ids: m.team1,
            team2_ids: m.team2,
            scheduled_date: null,
            result: null,
          }))
        );

        await supabase.from("match_fixtures").insert(insertData);
      }
    }

    setTournaments((prev) => [data, ...prev]);
    setCreating(false);
    navigate(`/tournaments/${data.id}`);
  };

  const now = new Date();
  const filtered = tournaments
    .filter((t) => {
      if (activeTab === "upcoming") return new Date(t.start_date) > now;
      if (activeTab === "ongoing")
        return new Date(t.start_date) <= now && new Date(t.end_date) >= now;
      if (activeTab === "finished") return new Date(t.end_date) < now;
      return true;
    })
    .filter((t) => {
      const term = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(term) ||
        (t.location && t.location.toLowerCase().includes(term))
      );
    });

  const createdCount = tournaments.filter((t) => t.creator_id === user?.id).length;
  const creationLimit = MEMBERSHIP_LIMITS[membershipTier] || 0;

  if (loading) return <p className="loading">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    // ✅ Inject the marble texture for every card via CSS var
    <div
      className="tournaments-page"
      style={{ "--marble-url": `url(${marbleImg})` }}
    >
      <section className="create-tournament">
        <div className="create-tournament-header">
          Create Tournament ({createdCount}/{creationLimit})
        </div>
        <div className="create-tournament-body">
          <div className="progress-bar">
            <motion.div
              className="progress-filled"
              layout
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
          <form className="wizard-form" onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tournament Name"
                  required
                />
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Location"
                  required
                />
              </>
            )}
            {step === 2 && (
              <>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
                <input
                  type="date"
                  name="end_date"
                  min={form.start_date}
                  value={form.end_date}
                  onChange={handleChange}
                  required
                />
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={handleChange}
                />
              </>
            )}
            {step === 3 && (
              <>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="knockout">Knockout</option>
                  <option value="group">Group</option>
                  <option value="league">League (Elite Only)</option>
                </select>
                {form.type === "knockout" && (
                  <input
                    type="number"
                    name="participants"
                    value={form.config.participants || ""}
                    onChange={handleConfig}
                    placeholder="Participants"
                  />
                )}
                {form.type === "group" && (
                  <>
                    <input
                      type="number"
                      name="groups"
                      value={form.config.groups || ""}
                      onChange={handleConfig}
                      placeholder="Groups"
                    />
                    <input
                      type="number"
                      name="groupSize"
                      value={form.config.groupSize || ""}
                      onChange={handleConfig}
                      placeholder="Group Size"
                    />
                  </>
                )}
                {form.type === "league" && (
                  <select
                    name="format"
                    value={form.config.format || "singles"}
                    onChange={handleConfig}
                  >
                    <option value="singles">Singles</option>
                    <option value="doubles">Doubles</option>
                  </select>
                )}
              </>
            )}
            {step === 4 && (
              <>
                <input type="file" accept="image/*" onChange={uploadPoster} disabled={creating} />
                {form.poster_url && (
                  <img src={form.poster_url} className="poster-preview" alt="Poster" />
                )}
              </>
            )}
            <div className="wizard-buttons">
              {step > 1 && <button onClick={back}>Back</button>}
              {step < 4 && <button onClick={next}>Next</button>}
              {step === 4 && (
                <button type="submit" disabled={creating || createdCount >= creationLimit}>
                  {creating ? "Creating…" : "Create Tournament"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ✅ New segmented tabs */}
      <div className="controls-bar">
        <div className="segmented-tabs" role="tablist" aria-label="Tournament filters">
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                className={isActive ? "segmented-tab active" : "segmented-tab"}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="tab-icon" aria-hidden="true">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
                {isActive && <motion.span layoutId="pill" className="segmented-pill" />}
              </button>
            );
          })}
        </div>

        <div className="tournament-search">
          <input
            type="search"
            placeholder="Search by name or location…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search tournaments"
          />
        </div>
      </div>

      <motion.div
        className="tournament-grid"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {filtered.length > 0 ? (
          filtered.map((t) => <TournamentCard key={t.id} tournament={t} />)
        ) : (
          <p className="no-results">No tournaments match your criteria.</p>
        )}
      </motion.div>

      <Routes>
        <Route path=":tournamentId" element={<TournamentOverview user={user} />} />
      </Routes>
    </div>
  );
}
