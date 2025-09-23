// src/components/Leaderboard/PlayerCardFront.jsx
import './Leaderboard.css';
import defaultCard from '../../assets/card-bg.jpg'; // ✅ Import this way

export default function PlayerCardFront({ player, rank, background }) {
  const {
    username,
    avatar_url,
    rating = 1000,
    win_percentage = 0,
    xp = 0,
    streak = 0,
    badges_unlocked = 0,
    total_badges = 10,
    club,
    region,
    last_match_date,
    is_premium = true,
  } = player;

  const daysSince = (dateStr) => {
    if (!dateStr) return "N/A";
    const diff = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
    return Math.floor(diff);
  };

  return (
    <div
      className="card-front gamified"
      style={{
        backgroundImage: `url(${background || defaultCard})`,
      }}
    >
      <div className="card-rank">#{rank}</div>
      <div className="card-avatar">
        <img
          src={avatar_url || "/default-avatar.png"}
          alt="avatar"
          className="avatar-img"
          onError={(e) => (e.target.src = "/default-avatar.png")}
        />
      </div>
      <h2 className="username">@{username}</h2>
      <p className="club-info">🏠 {club} | 📍 {region}</p>

      <div className="stats-container compact">
        <div className="stat-box">⚔️ Elo<br /><span>{rating}</span></div>
        <div className="stat-box">🎯 Win %<br /><span>{win_percentage}%</span></div>
        <div className="stat-box">🎮 XP<br /><span>{xp}</span></div>
        <div className="stat-box streak">🔥 Streak<br /><span>{streak}</span></div>
      </div>

      <div className="badges-preview">
        🏅 {badges_unlocked} / {total_badges} badges
      </div>
      <div className="last-played">
        ⏱ Played {daysSince(last_match_date)}d ago
      </div>
      {is_premium && <div className="premium-tag">⭐ Premium</div>}
    </div>
  );
}
