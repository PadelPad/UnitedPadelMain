import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LoginRegister.css';

function LoginRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      alert('Login failed: ' + error.message);
      return;
    }

    if (!data?.user) {
      alert('No user found.');
      return;
    }

    const userId = data.user.id;

    // Check if user is a club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('username')
      .eq('auth_user_id', userId)
      .single();

    if (clubError && clubError.code !== 'PGRST116') {
      console.error('Error checking club:', clubError);
    }

    if (club && club.username) {
      localStorage.setItem('accountType', 'club');
      localStorage.setItem('clubUsername', club.username);
    } else {
      localStorage.setItem('accountType', 'player');
    }

    // ✅ Always redirect to Home after login
    navigate('/');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handlePasswordReset = async () => {
    if (!email) return alert('Please enter your email first.');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) return alert('Reset failed: ' + error.message);
    alert('Password reset email sent!');
    setShowReset(false);
  };

  return (
    <div className="login-register-background">
      <motion.div
        className="login-register-container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="login-header">Welcome to United Padel</h2>
        <p className="login-subtext">Sign in or register to access rankings & tournaments</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {!showReset && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        )}

        {showReset ? (
          <>
            <button onClick={handlePasswordReset} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="back-to-login" onClick={() => setShowReset(false)}>← Back to Login</p>
          </>
        ) : (
          <>
            <button onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="divider">or</div>
            <button onClick={handleRegister}>
              Register
            </button>
            <p className="forgot-password" onClick={() => setShowReset(true)}>
              Forgot Password?
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default LoginRegister;