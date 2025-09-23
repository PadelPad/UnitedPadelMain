import React from 'react';

const ThankYou = () => (
  <div
    style={{
      minHeight: '100vh',
      background:
        'linear-gradient(135deg, #000000, #1a1a1a)',
      color: '#FF6600',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '1.7rem',
      fontWeight: '800',
      textAlign: 'center',
      padding: '2rem',
      flexDirection: 'column',
      letterSpacing: '0.1em',
      textShadow: '0 0 12px #FF6600',
    }}
  >
    <p>🎉 Thank you for joining the United Padel waitlist!</p>
    <p>We’ll keep you updated and notify you as soon as we launch.</p>
  </div>
);

export default ThankYou;