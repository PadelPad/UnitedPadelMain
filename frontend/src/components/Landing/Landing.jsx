import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TARGET_LAUNCH_DATE = new Date('2025-08-01T00:00:00');

const Landing = () => {
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState('');
  const [joiningCount, setJoiningCount] = useState(523);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = TARGET_LAUNCH_DATE - now;

      if (diff <= 0) {
        setCountdown('We are live!');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setJoiningCount((count) => count + Math.floor(Math.random() * 3) + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email');
      return;
    }
    const form = e.target;
    form.submit();
    setEmail('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
        color: '#FF6600',
        fontFamily:
          "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shattered overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'repeating-conic-gradient(from 45deg, transparent 0deg 10deg, rgba(255,102,0,0.05) 10deg 20deg)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <header style={{ marginBottom: '2rem', zIndex: 1 }}>
        {/* Logo */}
        <img
          src="/united-padel-logo-orange.png"
          alt="United Padel Logo"
          style={{ width: '160px', marginBottom: '1rem', filter: 'drop-shadow(0 0 5px #FF6600)' }}
        />
        <h1
          style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            letterSpacing: '0.15em',
            marginBottom: '0.3rem',
            textShadow: '0 0 12px #FF6600',
            textTransform: 'uppercase',
          }}
        >
          United Padel
        </h1>
        <p
          style={{
            fontSize: '1.3rem',
            maxWidth: '600px',
            margin: '0 auto',
            color: '#ffa64d',
            fontWeight: '600',
          }}
        >
          The UK’s premier padel platform for matches, leaderboards, tournaments & community.
          Launching soon — join the waitlist now!
        </p>

        {/* Countdown */}
        <div
          style={{
            marginTop: '1.5rem',
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#FF3300',
            letterSpacing: '0.1em',
            textShadow: '0 0 8px #FF3300',
          }}
          aria-label="Countdown to launch"
        >
          {countdown}
        </div>
      </header>

      <main
        style={{ zIndex: 1, width: '100%', maxWidth: '400px', marginBottom: '2rem' }}
      >
        <form
          onSubmit={handleSubmit}
          action="https://formsubmit.co/unitedpadel@example.com" // replace this with your unitedpadel email
          method="POST"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#1a1a1a',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 0 20px #FF6600',
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Your email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: '2px solid #FF6600',
              backgroundColor: '#000',
              color: '#FF6600',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#FF3300')}
            onBlur={(e) => (e.target.style.borderColor = '#FF6600')}
          />

          <button
            type="submit"
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: 'none',
              background:
                'linear-gradient(90deg, #FF6600, #FF3300)',
              color: '#fff',
              fontWeight: '800',
              fontSize: '1.2rem',
              cursor: 'pointer',
              boxShadow: '0 0 15px #FF3300',
              transition: 'background 0.3s ease',
            }}
            onMouseOver={(e) => (e.target.style.background = 'linear-gradient(90deg, #FF3300, #FF6600)')}
            onMouseOut={(e) => (e.target.style.background = 'linear-gradient(90deg, #FF6600, #FF3300)')}
          >
            Join Waitlist
          </button>

          <input type="text" name="_honey" style={{ display: 'none' }} />
          <input type="hidden" name="_captcha" value="false" />
          <input
            type="hidden"
            name="_next"
            value="https://unitedpadel.vercel.app/thank-you"
          />
        </form>
      </main>

      {/* Social Proof */}
      <section
        style={{
          color: '#FF9933',
          fontWeight: '700',
          fontSize: '1.1rem',
          textShadow: '0 0 8px #FF9933',
          zIndex: 1,
          marginBottom: '2rem',
        }}
        aria-live="polite"
      >
        🔥 <span>{joiningCount.toLocaleString()}</span> padel fans already joined the waitlist!
      </section>

      <footer
        style={{
          width: '100%',
          textAlign: 'center',
          paddingBottom: '1rem',
          fontSize: '0.9rem',
          color: '#FF6600',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <a
            href="https://twitter.com/unitedpadel"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FF6600', margin: '0 0.75rem', textDecoration: 'none' }}
          >
            Twitter
          </a>
          <a
            href="https://www.instagram.com/unitedpadelhq"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FF6600', margin: '0 0.75rem', textDecoration: 'none' }}
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@unitedpadelhq"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FF6600', margin: '0 0.75rem', textDecoration: 'none' }}
          >
            TikTok
          </a>
        </div>
        <p>© {new Date().getFullYear()} United Padel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;