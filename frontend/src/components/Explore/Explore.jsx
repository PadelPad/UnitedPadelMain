// src/pages/Explore.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();

  return (
    <div className="explore-container">
      <h2>Explore United Padel</h2>
      <p>Discover leaderboards, clubs, and tournaments happening across the UK!</p>
      <div className="explore-buttons">
        <button onClick={() => navigate('/leaderboard')}>🏆 View Leaderboards</button>
        <button onClick={() => navigate('/clubs')}>🏟️ Browse Clubs</button>
        <button onClick={() => navigate('/tournaments')}>🎾 Find Tournaments</button>
      </div>
    </div>
  );
};

export default Explore;