import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import NotificationsBell from '../Notifications/NotificationsBell';
import NotificationToast from '../Notifications/NotificationToast';
import './Navbar.css';
import logo from '../../assets/united-padel-logo.png';
import { getAccountType, getClubUsername } from '../../accountType';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return setUser(null);

      const accountType = getAccountType();
      if (accountType === 'club') {
        const { data: club } = await supabase
          .from('clubs')
          .select('username, avatar_url')
          .eq('auth_user_id', currentUser.id)
          .single();
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          username: club?.username || 'Club',
          avatar: club?.avatar_url || null,
          isClub: true,
        });
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', currentUser.id)
          .single();
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          username: profile?.username || currentUser.email,
          avatar: profile?.avatar_url || null,
          isClub: false,
        });
      }
    };

    fetchUser();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (sess?.user) fetchUser();
      else setUser(null);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`toast_channel_${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new;
          if (['streak', 'badge_unlocked', 'ranking'].includes(n.type)) {
            setToastNotification({ title: n.title, message: n.message });
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <nav className={`Navbar ${scrolled ? 'is-scrolled' : 'is-top'}`}>
      <div className="Navbar-inner">
        <div className="Navbar-left">
          <Link to="/" className="logo-link">
            <img src={logo} alt="United Padel" className="logo-image" />
          </Link>

          <ul className="Navbar-links">
            <li><Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link></li>
            <li><Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard')}`}>Leaderboard</Link></li>
            <li><Link to="/submit-match" className={`nav-link ${isActive('/submit-match')}`}>Submit Match</Link></li>
            <li><Link to="/tournaments" className={`nav-link ${isActive('/tournaments')}`}>Tournaments</Link></li>
            <li><Link to="/subscriptions" className={`nav-link ${isActive('/subscriptions')}`}>Subscriptions</Link></li>
            <li><Link to="/social" className={`nav-link ${isActive('/social')}`}>Social</Link></li>
            <li><Link to="/about" className={`nav-link ${isActive('/about')}`}>About Us</Link></li>
            <li><Link to="/faq" className={`nav-link ${isActive('/faq')}`}>FAQs</Link></li>
          </ul>
        </div>

        <div className="Navbar-right">
          {!user ? (
            <Link to="/login" className="btn-auth">Login / Register</Link>
          ) : (
            <div className="nav-profile-wrapper">
              <div className="nav-profile-dropdown">
                <button className="nav-profile" aria-haspopup="true" aria-expanded="false">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="nav-avatar" />
                  ) : (
                    <span className="nav-avatar-fallback">{user.username?.[0]?.toUpperCase()}</span>
                  )}
                  <span className="nav-username">{user.username}</span>
                </button>
                <ul className="dropdown">
                  {user.isClub ? (
                    <>
                      <li><Link to={`/club/${getClubUsername()}`} className="dropdown-link">My Club</Link></li>
                      <li><Link to={`/club/${getClubUsername()}/dashboard`} className="dropdown-link">Dashboard</Link></li>
                    </>
                  ) : (
                    <li><Link to="/profile" className="dropdown-link">My Profile</Link></li>
                  )}
                  <li><Link to="/account" className="dropdown-link">Account Settings</Link></li>
                  <li><button onClick={handleLogout} className="dropdown-link btn-plain">Logout</button></li>
                </ul>
              </div>

              <NotificationsBell userId={user.id} />
            </div>
          )}
        </div>
      </div>

      {toastNotification && <NotificationToast notification={toastNotification} />}
    </nav>
  );
}
