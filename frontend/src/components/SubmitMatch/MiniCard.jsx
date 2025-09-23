import './SubmitMatch.css';
import { UserPlus, Swords, Trophy } from 'lucide-react';

const MiniCard = ({ player, onSelect, onClick, disabled = false, highlight = false }) => {
  const handle = onSelect || onClick;
  return (
    <div
      className={`mini-card-wrapper submit-mode ${disabled ? 'disabled' : ''} ${highlight ? 'highlighted' : ''}`}
      onClick={() => !disabled && handle?.(player)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && handle?.(player)}
    >
      <div className="mini-card-content">
        <div className="mini-avatar-container">
          <img
            src={player?.avatar_url || '/default-avatar.png'}
            alt="avatar"
            className="mini-avatar"
            onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
          />
        </div>
        <div className="mini-info">
          <div className="mini-username">@{player?.username || 'player'}</div>
          <div className="mini-stats">
            <span className="mini-stat"><Swords size={14} /> {player?.rating ?? 1000}</span>
            <span className="mini-stat"><Trophy size={14} /> {player?.badges_count ?? 0}</span>
          </div>
        </div>
      </div>

      <button
        className="mini-card-button"
        onClick={(e) => { e.stopPropagation(); handle?.(player); }}
        disabled={disabled}
        aria-label={`Add ${player?.username || 'player'}`}
      >
        <UserPlus size={16} />
        Add
      </button>
    </div>
  );
};

export default MiniCard;
