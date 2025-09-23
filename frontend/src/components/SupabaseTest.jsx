import React, { useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function SupabaseTest() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('❌ Supabase error:', error);
      } else {
        console.log('✅ Supabase data:', data);
      }
    };

    testConnection();
  }, []);

  return <div>Testing Supabase Connection...</div>;
}

export default SupabaseTest;