import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const prices = [
  { key: 'basic', id: process.env.REACT_APP_STRIPE_PRICE_BASIC },
  { key: 'plus', id: process.env.REACT_APP_STRIPE_PRICE_PLUS },
  { key: 'elite', id: process.env.REACT_APP_STRIPE_PRICE_ELITE },
];

export default function Checkout() {
  const [status, setStatus] = useState<string | null>(null);

  async function startCheckout(priceId?: string) {
    if (!priceId) { setStatus('Missing price id'); return; }
    setStatus('Creating session...');
    const { data, error } = await supabase.functions.invoke('stripe-create-checkout-session', {
      body: { priceId, mode: 'subscription' }
    });
    if (error) { setStatus('Error: ' + error.message); return; }
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setStatus('No URL returned');
    }
  }

  return (
    <div>
      <h2>Subscribe</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        {prices.map(p => (
          <button key={p.key} onClick={() => startCheckout(p.id || undefined)}>
            {p.key.toUpperCase()}
          </button>
        ))}
      </div>
      {status && <p style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
