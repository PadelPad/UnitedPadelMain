import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const HotStreaks = () => {
  const [streaks, setStreaks] = useState([]);

  useEffect(() => {
    const fetchStreaks = async () => {
      const { data, error } = await supabase.rpc('get_hot_streaks');
      if (error) {
        console.error('Hot Streak error:', error);
      } else {
        setStreaks(data);
      }
    };
    fetchStreaks();
  }, []);

  return (
    <div className="p-4 bg-orange-100 rounded shadow">
      <h3 className="text-lg font-bold text-orange-600 mb-2">🔥 Hot Streaks</h3>
      <ul>
        {streaks.map((player, index) => (
          <li key={player.user_id} className="text-sm py-1">
            {index + 1}. {player.username} - {player.win_count} wins
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HotStreaks;