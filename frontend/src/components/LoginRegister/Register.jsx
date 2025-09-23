// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './LoginRegister.css';

// Avatars (your existing 8)
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';
import avatar4 from '../../assets/avatar4.png';
import avatar5 from '../../assets/avatar5.png';
import avatar6 from '../../assets/avatar6.png';
import avatar7 from '../../assets/avatar7.png';
import avatar8 from '../../assets/avatar8.png';

const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8];

const Register = () => {
  const navigate = useNavigate();

  // --- UI state
  const [accountType, setAccountType] = useState('individual'); // 'individual' | 'club'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedPreAvatar, setSelectedPreAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Data state (individual)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    gender: '',
    region: '',
    city_id: '',
    date_of_birth: '',
    phone_number: '',
    referral_code: '',
  });

  // --- Data state (club-only)
  const [clubData, setClubData] = useState({
    club_name: '',
    club_username: '',
    club_location: '',
    booking_url: '',
    courts: 0,
    indoor: false,
    outdoor: true,
    cafe: false,
  });

  // Regions/cities (kept)
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  // Load regions and cities
  useEffect(() => {
    const fetchData = async () => {
      const { data: reg } = await supabase.from('regions').select('*');
      const { data: ct } = await supabase.from('cities').select('*');
      setRegions(reg || []);
      setCities(ct || []);
    };
    fetchData();
  }, []);

  // Filter cities when region changes
  useEffect(() => {
    const regionObj = regions.find(r => r.name === formData.region);
    if (regionObj) {
      const filtered = cities.filter(c => c.region_id === regionObj.id);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [formData.region, cities, regions]);

  // Handlers
  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleClubChange = (e) => {
    const { name, type, value, checked } = e.target;
    setClubData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };
  const handlePhoneChange = (value) => setFormData(p => ({ ...p, phone_number: value }));
  const handleAvatarSelect = (url) => { setSelectedPreAvatar(url); setUploadFile(null); };
  const handleFileChange = (e) => { setUploadFile(e.target.files[0]); setSelectedPreAvatar(''); };

  // Validation (keeps your checks and adds club checks)
  const validateForm = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Invalid email address.';
    if ((formData.password || '').length < 6) return 'Password must be at least 6 characters.';
    if (!formData.username) return 'Please choose a username.';
    if (!formData.region || !formData.city_id) return 'Select region and city.';
    if (!formData.gender) return 'Select gender.';
    if (!formData.date_of_birth) return 'Select date of birth.';
    if (!formData.phone_number || formData.phone_number.replace(/\D/g, '').length < 8) return 'Enter a valid phone number.';
    if (!uploadFile && !selectedPreAvatar) return 'Please choose or upload a profile image.';
    if (!agreedToTerms) return 'You must agree to the terms of service.';

    // Smart uniqueness validation (profiles)
    const { data: emailCheck } = await supabase.from('profiles').select('email').eq('email', formData.email);
    if (emailCheck?.length > 0) return 'Email already in use.';

    const { data: usernameCheck } = await supabase.from('profiles').select('username').eq('username', formData.username);
    if (usernameCheck?.length > 0) return 'Username already taken.';

    const { data: phoneCheck } = await supabase.from('profiles').select('phone_number').eq('phone_number', formData.phone_number);
    if (phoneCheck?.length > 0) return 'Phone number already registered.';

    // If club account, validate club-specific fields and uniqueness
    if (accountType === 'club') {
      if (!clubData.club_name) return 'Enter your club name.';
      if (!clubData.club_username) return 'Choose a club username (slug).';
      const slug = clubData.club_username.trim().toLowerCase();
      const { data: clubUserCheck } = await supabase.from('clubs').select('username').eq('username', slug);
      if (clubUserCheck?.length > 0) return 'Club username is already taken.';
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const valid = await validateForm();
    if (valid !== true) {
      setErrorMsg(valid);
      setLoading(false);
      return;
    }

    try {
      // 1) Auth sign up
      const { data: auth, error: signErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      if (signErr || !auth?.user?.id) throw new Error(signErr?.message || 'Signup failed');
      const userId = auth.user.id;

      // 2) Upload avatar if needed
      let avatarUrl = selectedPreAvatar;
      if (uploadFile) {
        const ext = uploadFile.name.split('.').pop();
        const path = `avatars/${userId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, uploadFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      // 3) Create / upsert profile with account_type
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: userId,
        user_id: userId,
        email: formData.email,
        username: formData.username,
        gender: formData.gender,
        region: formData.region,
        city_id: formData.city_id,
        date_of_birth: formData.date_of_birth,
        subscription_tier: 'free',
        avatar_url: avatarUrl,
        phone_number: formData.phone_number,
        referral_code: formData.referral_code || null,
        account_type: accountType, // NEW
      }, { onConflict: 'id' });
      if (profileErr) throw profileErr;

      // 4) If Club → create club + membership (owner) and optionally set profile.club_id
      if (accountType === 'club') {
        const slug = clubData.club_username.trim().toLowerCase();
        const facilities = {
          courts: Number(clubData.courts) || 0,
          indoor: !!clubData.indoor,
          outdoor: !!clubData.outdoor,
          cafe: !!clubData.cafe,
        };

        const { data: club, error: clubErr } = await supabase
          .from('clubs')
          .insert({
            username: slug,
            name: clubData.club_name.trim(),
            location: clubData.club_location || null,
            booking_url: clubData.booking_url || null,
            facilities,
            created_by: userId,
            subscription_tier: 'free',
          })
          .select('*')
          .single();
        if (clubErr) throw clubErr;

        // Set home club (optional)
        await supabase.from('profiles').update({ club_id: club.id }).eq('id', userId);

        // Owner membership
        const { error: memErr } = await supabase
          .from('club_members')
          .insert({ club_id: club.id, user_id: userId, role: 'owner', status: 'active' });
        if (memErr) throw memErr;

        // Welcome badge still applies to users (kept)
        const { data: badge } = await supabase.from('badges').select('id').eq('title', 'Welcome!').maybeSingle();
        if (badge?.id) await supabase.from('user_badges').insert({ profile_id: userId, badge_id: badge.id });

        alert('✅ Club account created! Check your email to verify your account.');
        navigate(`/clubs/${club.username}`);
        return;
      }

      // 5) Award welcome badge (individual)
      const { data: badge } = await supabase.from('badges').select('id').eq('title', 'Welcome!').maybeSingle();
      if (badge?.id) await supabase.from('user_badges').insert({ profile_id: userId, badge_id: badge.id });

      alert('✅ Registration complete! Check your email to verify your account.');
      navigate('/');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-register-background">
      <motion.div
        className="login-register-container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="login-header">Create Your Account</h2>

        {/* Toggle (keeps your styling; adjust CSS if needed) */}
        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn ${accountType === 'individual' ? 'active' : ''}`}
            onClick={() => setAccountType('individual')}
          >
            Individual
          </button>
          <button
            type="button"
            className={`type-btn ${accountType === 'club' ? 'active' : ''}`}
            onClick={() => setAccountType('club')}
          >
            Club
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email / Password / Username */}
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} required />
          <input name="username" type="text" placeholder="Username" onChange={handleChange} required />

          {/* Region & City (kept) */}
          <select name="region" onChange={handleChange} required defaultValue="">
            <option value="" disabled>Select your region</option>
            {regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>

          <select name="city_id" onChange={handleChange} required defaultValue="">
            <option value="" disabled>Select your city</option>
            {filteredCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Gender & DOB (kept) */}
          <select name="gender" onChange={handleChange} required defaultValue="">
            <option value="" disabled>Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>

          <input name="date_of_birth" type="date" onChange={handleChange} required />

          {/* Phone (kept) */}
          <PhoneInput
            country={'gb'}
            value={formData.phone_number}
            onChange={handlePhoneChange}
            inputStyle={{ width: '100%', marginBottom: '1rem' }}
          />

          {/* Referral (kept) */}
          <input name="referral_code" type="text" placeholder="Referral code (optional)" onChange={handleChange} />

          {/* Club-only fields */}
          {accountType === 'club' && (
            <>
              <p className="section-label" style={{ marginTop: '0.75rem' }}>Club details</p>
              <input name="club_name" type="text" placeholder="Club name" onChange={handleClubChange} required />
              <input name="club_username" type="text" placeholder="Club username (slug)" onChange={handleClubChange} required />
              <input name="club_location" type="text" placeholder="Location" onChange={handleClubChange} />
              <input name="booking_url" type="url" placeholder="Booking URL (optional)" onChange={handleClubChange} />
              <div className="club-facilities-grid">
                <div>
                  <label>Courts</label>
                  <input name="courts" type="number" min="0" onChange={handleClubChange} />
                </div>
                <label className="checkbox-inline">
                  <input type="checkbox" name="indoor" onChange={handleClubChange} /> Indoor
                </label>
                <label className="checkbox-inline">
                  <input type="checkbox" name="outdoor" defaultChecked onChange={handleClubChange} /> Outdoor
                </label>
                <label className="checkbox-inline">
                  <input type="checkbox" name="cafe" onChange={handleClubChange} /> Cafe
                </label>
              </div>
            </>
          )}

          {/* Avatar (kept) */}
          <p className="section-label">Upload your photo or pick an avatar</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <div className="avatar-grid">
            {AVATARS.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`avatar-${idx}`}
                className={`avatar-option ${selectedPreAvatar === url ? 'selected' : ''}`}
                onClick={() => handleAvatarSelect(url)}
              />
            ))}
          </div>

          {/* Terms (kept) */}
          <label className="tos-checkbox">
            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
            <span>I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a></span>
          </label>

          {errorMsg && <p className="error-text">{errorMsg}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : (accountType === 'club' ? 'Create Club Account' : 'Register')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
