import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const RegionSelector = ({ onSelect }) => {
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase.from('regions').select('*');
      if (error) console.error('Regions error:', error);
      else setRegions(data);
    };

    fetchRegions();
  }, []);

  return (
    <select
      className="border p-2 rounded"
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="">All Regions</option>
      {regions.map((region) => (
        <option key={region.id} value={region.id}>
          {region.name}
        </option>
      ))}
    </select>
  );
};

export default RegionSelector;