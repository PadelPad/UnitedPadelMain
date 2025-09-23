// src/components/Leaderboard/MiniCard.jsx
import './Leaderboard.css';
import { useState } from 'react';
import FlipCardWrapper from './FlipCardWrapper';
import PlayerCardFront from './PlayerCardFront';
import PlayerCardBack from './PlayerCardBack';

export default function MiniCard({ player, rank, isCurrentUser }) {
  const [showFull, setShowFull] = useState(false);

  const handleExpand = () => {
    setShowFull(true);
  };

  const handleClose = () => {
    setShowFull(false);
  };

  return (
    <>
      <div
        className={`mini-card-wrapper ${isCurrentUser ? 'highlighted' : ''}`}
        onClick={handleExpand}
      >
        <div className="mini-card-content">
          <div className="mini-avatar-container">
            <img
              src={player.avatar_url || '/default-avatar.png'}
              alt="avatar"
              className="mini-avatar"
              onError={(e) => (e.target.src = '/default-avatar.png')}
            />
          </div>
          <div className="mini-info">
            <div className="mini-username">@{player.username}</div>
            <div className="mini-rank">#{rank}</div>
          </div>
        </div>
        <div className="mini-stats">
          <div className="mini-stat">⚔ {player.rating || 1000}</div>
          <div className="mini-stat">🔥 {player.streak || 0}</div>
          <div className="mini-stat">🏅 {player.badges_count || 0}</div>
        </div>
      </div>

      {showFull && (
        <div className="full-card-modal" onClick={handleClose}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <FlipCardWrapper
              front={<PlayerCardFront player={player} rank={rank} />}
              back={<PlayerCardBack player={player} />}
            />
            <div className="close-modal-btn" onClick={handleClose}>
              ✖
            </div>
          </div>
        </div>
      )}
    </>
  );
}
