import React, { useEffect, useState } from 'react';
import './TopClubsSection.css';
import supabase from '../supabaseClient';

const TopClubsSection = () => {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    const fetchClubs = async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          subscription_tier,
          players:profiles(
            id,
            name,
            rating,
            subscription_tier
          )
        `)
        .eq('subscription_tier', 'premium');

      if (error) {
        console.error('Error fetching clubs:', error);
      } else {
        // Sort players within each club
        const enriched = data.map(club => ({
          ...club,
          players: club.players.sort((a, b) => b.rating - a.rating),
        }));
        setClubs(enriched);
      }
    };

    fetchClubs();
  }, []);

  return (
    <div className="top-clubs-container">
      <h2>🏆 Top Clubs</h2>
      {clubs.length === 0 ? (
        <p>No premium clubs found.</p>
      ) : (
        clubs.map(club => (
          <div key={club.id} className="club-card">
            <h3>{club.name}</h3>
            <p className="club-tier">{club.subscription_tier.toUpperCase()} CLUB</p>
            <div className="players-list">
              {club.players.map(player => (
                <div key={player.id} className="player-card">
                  <span className="player-name">{player.name}</span>
                  <span className="player-rating">{player.rating} Elo</span>
                  {player.subscription_tier === 'premium' && <span className="player-badge">★</span>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TopClubsSection;