// src/components/Tournaments/TournamentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import marbleImg from "./marble.jpg"; // ✅ same folder
import "./Tournaments.css";

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return "TBD";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatus = () => {
    const now = new Date();
    const start = new Date(tournament.start_date);
    const end = new Date(tournament.end_date);
    if (!tournament.start_date || !tournament.end_date) return "upcoming";
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    return "finished";
  };

  const status = getStatus();

  return (
    <motion.article
      className={`tournament-card ${status}`}
      style={{
        backgroundImage: `url(${marbleImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 300 }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/tournaments/${tournament.id}`);
      }}
      role="button"
      aria-label={`View details for tournament ${tournament.name}`}
    >
      {tournament.poster_url && (
        <div
          className="card-banner"
          style={{ backgroundImage: `url(${tournament.poster_url})` }}
        />
      )}

      <div className="card-content">
        <div className="card-badges">
          {status === "finished" && <span className="badge winner">🏆 Winner</span>}
          {status === "ongoing" && <span className="badge fire">🔥 On Fire</span>}
          {status === "upcoming" && <span className="badge">⏳ Upcoming</span>}
        </div>

        <div className="card-header">
          <h3 className="card-title">{tournament.name}</h3>
        </div>

        <div className="card-meta">
          <span className="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14l7-3 7 3V6c0-1.1-.9-2-2-2zM12 17l-5 2V8h10v11l-5-2z"/>
            </svg>
            {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
          </span>
          {tournament.location && (
            <span className="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z"/>
              </svg>
              {tournament.location}
            </span>
          )}
        </div>

        <p className="card-desc">
          {tournament.description
            ? tournament.description.slice(0, 100) + "…"
            : "No description…"}
        </p>
      </div>
    </motion.article>
  );
};

export default TournamentCard;
