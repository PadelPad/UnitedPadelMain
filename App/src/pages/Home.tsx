import React from 'react';

export default function Home() {
  return (
    <div>
      <h1>Welcome to PadelPad</h1>
      <p>Supabase project: {process.env.REACT_APP_SUPABASE_URL ? 'configured ✅' : 'not configured ⚠️'}</p>
    </div>
  );
}
