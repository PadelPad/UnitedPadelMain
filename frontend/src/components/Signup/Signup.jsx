// src/pages/Signup.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email to confirm your signup!' });
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up for United Padel</h2>
      <form onSubmit={handleSignup} className="auth-form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Sign Up</button>
      </form>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </div>
  );
};

export default Signup;