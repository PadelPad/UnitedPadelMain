// src/propTypes.js
import PropTypes from "prop-types";

export const userShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  role: PropTypes.string,
  username: PropTypes.string,
  is_premium: PropTypes.bool,
});

export const linksShape = PropTypes.shape({
  instagram: PropTypes.string,
  facebook: PropTypes.string,
  website: PropTypes.string,
});

export const playerShape = PropTypes.shape({
  id: PropTypes.string,
  username: PropTypes.string.isRequired,
  avatar_url: PropTypes.string,
  rating: PropTypes.number,
  win_percentage: PropTypes.number,
  xp: PropTypes.number,
  xp_to_next: PropTypes.number,
  level: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  streak: PropTypes.number,
  badges_unlocked: PropTypes.number,
  total_badges: PropTypes.number,
  badges_count: PropTypes.number,
  club: PropTypes.string,
  region: PropTypes.string,
  last_match_date: PropTypes.string,
  last_active: PropTypes.string,
  elo_history: PropTypes.arrayOf(PropTypes.number),
  match_results: PropTypes.arrayOf(PropTypes.oneOf(["W", "L"])),
  upcoming_badge: PropTypes.string,
  is_premium: PropTypes.bool,
});

export const notificationShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.string.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  metadata: PropTypes.shape({
    match_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
});

export const tournamentShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  start_date: PropTypes.string,
  end_date: PropTypes.string,
  location: PropTypes.string,
  poster_url: PropTypes.string,
});

export const childrenType = PropTypes.oneOfType([
  PropTypes.node,
  PropTypes.arrayOf(PropTypes.node),
]);
