// src/components/Leaderboard/Leaderboard.jsx
import { useEffect, useMemo, useState } from "react";
import FlipCardWrapper from "./FlipCardWrapper";
import PlayerCardFront from "./PlayerCardFront";
import PlayerCardBack from "./PlayerCardBack";
import MiniCard from "./MiniCard";
import "./Leaderboard.css";
import "./Podium.css";
import { supabase } from "../../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { Trophy, MapPin, Users, Shield, Cake } from "lucide-react";

import goldcard from "../../assets/goldcard.png";
import silvercard from "../../assets/silvercard.png";
import bronzecard from "../../assets/bronzecard.png";

const ITEMS_PER_PAGE = 30;

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ region: "", gender: "", club: "", ageGroup: "" });
  const [clubOptions, setClubOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const user = useUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);

      // ✅ Only select columns that exist in your schema
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select(
          "id, username, avatar_url, rating, region_id, region, club_id, club, gender, date_of_birth, matches_played, is_verified, account_type"
        )
        // include NULL account_type rows (treat as individual)
        .or("account_type.is.null,account_type.eq.individual")
        // ✅ Remove nullsFirst/nullsLast (causes 400 on some stacks)
        .order("rating", { ascending: false });

      if (pErr) {
        console.error("profiles error", pErr);
        setLoadError(pErr.message || "Failed to load profiles");
      }

      const { data: clubs, error: cErr } = await supabase
        .from("clubs")
        .select("id, name, subscription_tier");
      if (cErr) console.error("clubs error", cErr);

      const { data: regions, error: rErr } = await supabase
        .from("regions")
        .select("id, name");
      if (rErr) console.error("regions error", rErr);

      // Since `is_ranked` doesn't exist in DB, default everyone to ranked
      const safePlayers = (profiles || []).filter((p) => {
        const t = (p.account_type || "individual").toString().toLowerCase();
        return t !== "club";
      });

      // Optional: client-side NULLS LAST for rating, if you care about it
      const sortedPlayers = safePlayers
        .slice()
        .sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));

      setPlayers(sortedPlayers);

      const eliteClubs = (clubs || []).filter((c) =>
        ["plus", "elite"].includes((c.subscription_tier || "").toLowerCase())
      );
      setClubOptions(eliteClubs.map((c) => ({ id: c.id, name: c.name })));
      setRegionOptions(regions || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  const getAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getAgeGroup = (dob) => {
    const age = getAge(dob);
    if (age == null) return null;
    if (age < 18) return "U18";
    if (age <= 25) return "18-25";
    if (age <= 35) return "26-35";
    if (age <= 45) return "36-45";
    if (age <= 60) return "46-60";
    return "60+";
  };

  const handleFilterChange = (e) => {
    setCurrentPage(1);
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ region: "", gender: "", club: "", ageGroup: "" });
  };

  const genderEqual = (a, b) =>
    (a || "").toString().toLowerCase() === (b || "").toString().toLowerCase();

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const regionMatch = !filters.region || player.region_id === filters.region;
      const genderMatch = !filters.gender || genderEqual(player.gender, filters.gender);
      const clubMatch = !filters.club || player.club_id === filters.club;
      const ageGroupMatch = !filters.ageGroup || getAgeGroup(player.date_of_birth) === filters.ageGroup;
      return regionMatch && genderMatch && clubMatch && ageGroupMatch;
    });
  }, [players, filters]);

  const currentUser = players.find((p) => p.id === user?.id) || null;
  const currentUserRank = currentUser
    ? filteredPlayers.findIndex((p) => p.id === user?.id) + 1
    : null;

  const top15 = filteredPlayers.slice(0, 15);
  const rest = filteredPlayers.slice(15);

  const totalPages = Math.ceil(rest.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPagePlayers = rest.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const shouldShowUserCard =
    !!currentUser &&
    (currentUserRank || 0) > 15 &&
    !currentPagePlayers.some((p) => p.id === currentUser.id);

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = Math.min(totalPages, 10);
    for (let i = 1; i <= maxPagesToShow; i++) {
      pages.push(
        <button
          key={i}
          className={`page-btn ${i === currentPage ? "active" : ""}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    const showEllipsis =
      currentUserRank && currentUserRank > 15 + ITEMS_PER_PAGE * maxPagesToShow;

    return (
      <>
        {pages}
        {showEllipsis && (
          <>
            <span className="ellipsis">...</span>
            <button
              className="page-btn special"
              onClick={() =>
                setCurrentPage(Math.ceil((currentUserRank - 15) / ITEMS_PER_PAGE))
              }
            >
              You #{currentUserRank}
            </button>
          </>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <Trophy size={48} strokeWidth={2.5} className="trophy-icon" />
          <h1 className="leaderboard-heading-text">United Padel Leaderboard</h1>
        </div>
        <p className="loading-text">Loading leaderboard…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <Trophy size={48} strokeWidth={2.5} className="trophy-icon" />
          <h1 className="leaderboard-heading-text">United Padel Leaderboard</h1>
        </div>
        <p className="error-text">Error loading leaderboard: {loadError}</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      {/* ✨ Title */}
      <div className="leaderboard-header">
        <Trophy size={48} strokeWidth={2.5} className="trophy-icon" />
        <h1 className="leaderboard-heading-text">United Padel Leaderboard</h1>
      </div>

      {/* 🔍 Filters */}
      <div className="filters-row frosted-glass">
        <label className="filter-label">
          <MapPin size={16} /> Region
          <select name="region" onChange={handleFilterChange} value={filters.region}>
            <option value="">All</option>
            {regionOptions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-label">
          <Users size={16} /> Gender
          <select name="gender" onChange={handleFilterChange} value={filters.gender}>
            <option value="">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="filter-label">
          <Shield size={16} /> Club
          <select name="club" onChange={handleFilterChange} value={filters.club}>
            <option value="">All</option>
            {clubOptions.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-label">
          <Cake size={16} /> Age
          <select name="ageGroup" onChange={handleFilterChange} value={filters.ageGroup}>
            <option value="">All</option>
            <option value="U18">U18</option>
            <option value="18-25">18–25</option>
            <option value="26-35">26–35</option>
            <option value="36-45">36–45</option>
            <option value="46-60">46–60</option>
            <option value="60+">60+</option>
          </select>
        </label>

        <button className="reset-btn" onClick={clearFilters}>Reset</button>
      </div>

      {/* 🥇 Podium */}
      <div className="podium-wrapper">
        {top15[1] && (
          <div className="podium-step second">
            <FlipCardWrapper
              front={<PlayerCardFront player={top15[1]} rank={2} background={silvercard} />}
              back={<PlayerCardBack player={top15[1]} background={silvercard} />}
            />
          </div>
        )}
        {top15[0] && (
          <div className="podium-step first">
            <FlipCardWrapper
              front={<PlayerCardFront player={top15[0]} rank={1} background={goldcard} />}
              back={<PlayerCardBack player={top15[0]} background={goldcard} />}
            />
          </div>
        )}
        {top15[2] && (
          <div className="podium-step third">
            <FlipCardWrapper
              front={<PlayerCardFront player={top15[2]} rank={3} background={bronzecard} />}
              back={<PlayerCardBack player={top15[2]} background={bronzecard} />}
            />
          </div>
        )}
      </div>

      {/* 🏅 Ranks 4–15 */}
      <div className="leaderboard-grid">
        {top15.slice(3).map((player, index) => (
          <FlipCardWrapper
            key={player.id}
            front={<PlayerCardFront player={player} rank={index + 4} />}
            back={<PlayerCardBack player={player} />}
          />
        ))}
      </div>

      {/* 🎖️ Ranks 16+ */}
      <div className="minicard-row">
        {currentPagePlayers.map((player, index) => (
          <MiniCard
            key={player.id}
            player={player}
            rank={index + 16 + (currentPage - 1) * ITEMS_PER_PAGE}
            isCurrentUser={user?.id === player.id}
          />
        ))}
        {shouldShowUserCard && currentUser && (
          <MiniCard player={currentUser} rank={currentUserRank} isCurrentUser />
        )}
      </div>

      {/* ⏬ Pagination */}
      <div className="pagination-controls">{renderPagination()}</div>
    </div>
  );
}
