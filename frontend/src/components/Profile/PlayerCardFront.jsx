// /src/components/Profile/PlayerCardFront.jsx
import React from "react";
import cardBg from "../../assets/backgroundfill.jpg";
import "./PlayerCard.css";

const DEFAULT_AVATAR = "/default-avatar.png";

export default function PlayerCardFront({ player }) {
  const avatar = player?.avatar_url || DEFAULT_AVATAR;
  const username = player?.username || "Unknown";
  const club = player?.club || "No Club";
  const region = player?.region || "Unknown";
  const elo = Number(player?.rating) || 1000;
  const badges = Number(player?.badges_count) || 0;
  const winPercentage = Math.round(Number(player?.win_percentage ?? 0));
  const xp = Math.max(0, Number(player?.xp) || 0);
  const streak = Number(player?.streak ?? 0);

  const lastPlayed = player?.last_active
    ? `Played ${formatDaysAgo(player.last_active)} ago`
    : "Inactive";

  function formatDaysAgo(dateString) {
    const last = new Date(dateString);
    if (isNaN(last)) return "Inactive";
    const now = new Date();
    const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "today" : `${diff} day${diff > 1 ? "s" : ""}`;
  }

  return (
    <div
      className="upPlayerCard"
      style={{ backgroundImage: `url(${cardBg})` }}
      aria-label="Player card"
    >
      <div className="upCardInner">
        <img
          src={avatar}
          onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
          alt={`${username} avatar`}
          className="upAvatar"
        />
        <h2 className="upUsername">{username}</h2>
        <p className="upSubtext">
          {club} • {region}
        </p>

        <div className="upStatsGrid" aria-label="Player stats">
          <div className="upStat">
            <span className="upStatLabel">🏆 Elo</span>
            <span className="upStatValue">{elo}</span>
          </div>
          <div className="upStat">
            <span className="upStatLabel">Win %</span>
            <span className="upStatValue">{winPercentage}%</span>
          </div>
          <div className="upStat">
            <span className="upStatLabel">⚡ XP</span>
            <span className="upStatValue">{xp}</span>
          </div>
          <div className="upStat">
            <span className="upStatLabel">🔥 Streak</span>
            <span className="upStatValue">{streak}</span>
          </div>
        </div>

        <div className="upBadges">
          💎 {badges} {badges === 1 ? "badge" : "badges"}
        </div>
        <p className="upLastPlayed">{lastPlayed}</p>
      </div>
    </div>
  );
}
