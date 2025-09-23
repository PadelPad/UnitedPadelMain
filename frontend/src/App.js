// src/App.js
import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

import { supabase } from './supabaseClient.js';
import { initPush } from './lib/push.js';
import { setNavigate } from './lib/nav.js';
// Existing components
import Layout from './components/Layout/Layout.jsx';
import Home from './components/Home/Home.jsx';
import Leaderboard from './components/Leaderboard/Leaderboard.jsx';
import Tournaments from './components/Tournaments/Tournaments.jsx';
import TournamentOverview from './components/Tournaments/TournamentOverview.jsx';
import Challenges from './components/Challenges/Challenges.jsx';
import Badges from './components/Badges/Badges.jsx';
import AboutUs from './components/AboutUs/AboutUs.jsx';
import SubmitMatch from './components/SubmitMatch/SubmitMatch.jsx';
import LoginRegister from './components/LoginRegister/LoginRegister.jsx';
import Register from './components/LoginRegister/Register.jsx';
import Pricing from './components/Pricing/Pricing.jsx';
import SubscriptionPlans from './components/Subscriptions/SubscriptionPlans.jsx';
import Success from './components/Pricing/Success.jsx';
import Cancel from './components/Pricing/Cancel.jsx';
import MyProfile from './components/Profile/MyProfile.jsx';
import AccountSettings from './components/Profile/AccountSettings.jsx';
import ClubProfilePage from './components/Club/ClubProfilePage.jsx';
import ClubDashboard from './components/ClubDashboard/ClubDashboard.jsx';
import Terms from './components/Legal/Terms.jsx';
import Privacy from './components/Legal/Privacy.jsx';
import CookiePolicy from './components/Legal/CookiePolicy.jsx';
import RefundPolicy from './components/Legal/RefundPolicy.jsx';
import PhotoConsent from './components/Legal/PhotoConsent.jsx';
import ChildProtection from './components/Legal/ChildProtection.jsx';
import FAQSection from './components/FAQ/FAQSection.jsx';
// ✅ Approvals inbox
import PendingApprovals from './components/Approvals/PendingApprovals.jsx';
// ✅ Admin: Disputes (only for your UUID)
import AdminDisputes from './components/Admin/AdminDisputes.jsx';

// ✅ NEW: Social (lazy-loaded for performance)
const SocialTab = lazy(() => import('./social/SocialTab.jsx'));

// Styles
import './styles/theme.css';
import './App.css';

const ADMIN_ID = 'd7391650-b1ee-4cc8-b4a8-6ebc6eb014e3';

function AppWrapper() {
  const [user, setUser] = useState(null);

  const [accountCtx, setAccountCtx] = useState({
    actorType: null,      // 'club' | 'individual'
    tier: null,           // 'basic' | 'plus' | 'elite'
    clubUsername: null    // e.g. 'united-wrexham'
  });

  // Auto-logout after 1h inactivity
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        toast.error('Session expired. You were logged out.');
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = '/login';
      }, 60 * 60 * 1000);
    };
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
      window.addEventListener(evt, resetTimer)
    );
    resetTimer();
    return () => {
      clearTimeout(timer);
      ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, []);

  // Detect Supabase user + role/tier
  useEffect(() => {
    const detectAccountContext = async () => {
      const { data: { user: supaUser }, error } = await supabase.auth.getUser();
      if (error || !supaUser) {
        setUser(null);
        setAccountCtx({ actorType: null, tier: null, clubUsername: null });
        localStorage.removeItem('actorType');
        localStorage.removeItem('tier');
        localStorage.removeItem('clubUsername');
        return;
      }

      setUser(supaUser);

      // 1) Club owned by this auth user?
      const { data: clubByOwner } = await supabase
        .from('clubs')
        .select('username, subscription_tier, subscription_plan')
        .eq('auth_user_id', supaUser.id)
        .maybeSingle();

      if (clubByOwner) {
        const clubTier = clubByOwner.subscription_tier || clubByOwner.subscription_plan || 'basic';
        const ctx = { actorType: 'club', tier: clubTier, clubUsername: clubByOwner.username || '' };
        setAccountCtx(ctx);
        localStorage.setItem('actorType', ctx.actorType);
        localStorage.setItem('tier', ctx.tier);
        localStorage.setItem('clubUsername', ctx.clubUsername);
        if (window.location.pathname === '/profile') {
          window.location.replace(`/club/${ctx.clubUsername}/dashboard`);
        }
        return;
      }

      // 2) Fallback to profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, account_type, club_id')
        .eq('id', supaUser.id)
        .maybeSingle();

      if (profile?.account_type === 'club' && profile?.club_id) {
        const { data: clubById } = await supabase
          .from('clubs')
          .select('username, subscription_tier, subscription_plan')
          .eq('id', profile.club_id)
          .maybeSingle();

        if (clubById) {
          const clubTier = clubById.subscription_tier || clubById.subscription_plan || 'basic';
          const ctx = { actorType: 'club', tier: clubTier, clubUsername: clubById.username || '' };
          setAccountCtx(ctx);
          localStorage.setItem('actorType', ctx.actorType);
          localStorage.setItem('tier', ctx.tier);
          localStorage.setItem('clubUsername', ctx.clubUsername);
          if (window.location.pathname === '/profile') {
            window.location.replace(`/club/${ctx.clubUsername}/dashboard`);
          }
          return;
        }
      }

      // 3) Individual
      const userTier = profile?.subscription_tier || 'basic';
      const ctx = { actorType: 'individual', tier: userTier, clubUsername: null };
      setAccountCtx(ctx);
      localStorage.setItem('actorType', ctx.actorType);
      localStorage.setItem('tier', ctx.tier);
      localStorage.removeItem('clubUsername');
    };

    detectAccountContext();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) detectAccountContext();
      else {
        setAccountCtx({ actorType: null, tier: null, clubUsername: null });
        localStorage.removeItem('actorType');
        localStorage.removeItem('tier');
        localStorage.removeItem('clubUsername');
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  // Native push (no-op on web)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initPush(
        (token) => console.log('FCM token:', token),
        (n) => console.log('Notification:', n)
      );
    }
  }, []);

  const router = useMemo(() => createRouter(user, accountCtx), [user, accountCtx]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}

// forward navigate() so navigateTo() works anywhere
function NavBridge() {
  const navigate = useNavigate();
  useEffect(() => { setNavigate(navigate); }, [navigate]);
  return null;
}

function RootLayout() {
  return (
    <Layout>
      <NavBridge />
      <Outlet />
    </Layout>
  );
}

// Guard for auth-only pages
function RequireAuth({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [user, navigate, location]);
  if (!user) return null;
  return children;
}

// Guard for admin-only pages (by UUID)
function RequireAdmin({ user, children }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.id !== ADMIN_ID) {
      toast.error('Admins only');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  if (!user || user.id !== ADMIN_ID) return null;
  return children;
}

function createRouter(user, accountCtx) {
  const { actorType, tier, clubUsername } = accountCtx;

  return createBrowserRouter(
    [
      {
        path: '/',
        element: <RootLayout />,
        children: [
          // Public
          { path: '/', element: <Home /> },
          { path: 'login', element: <LoginRegister /> },
          { path: 'register', element: <Register /> },
          { path: 'about', element: <AboutUs /> },

          // Pricing
          { path: 'pricing', element: <Pricing user={user} actorType={actorType} currentTier={tier} /> },
          { path: 'subscriptions', element: <SubscriptionPlans user={user} actorType={actorType} currentTier={tier} clubUsername={clubUsername || undefined} /> },
          { path: 'success', element: <Success /> },
          { path: 'cancel', element: <Cancel /> },
          { path: 'faq', element: <FAQSection /> },

          // Legal
          { path: 'terms', element: <Terms /> },
          { path: 'privacy', element: <Privacy /> },
          { path: 'cookie-policy', element: <CookiePolicy /> },
          { path: 'refund-policy', element: <RefundPolicy /> },
          { path: 'photo-consent', element: <PhotoConsent /> },
          { path: 'child-protection', element: <ChildProtection /> },

          // Club
          { path: 'club/:username', element: <ClubProfilePage /> },
          { path: 'club/:username/dashboard', element: <ClubDashboard /> },

          // Auth-only
          { path: 'profile', element: (<RequireAuth user={user}><MyProfile user={user} /></RequireAuth>) },
          { path: 'account', element: (<RequireAuth user={user}><AccountSettings user={user} /></RequireAuth>) },
          { path: 'leaderboard', element: (<RequireAuth user={user}><Leaderboard user={user} /></RequireAuth>) },
          {
            path: 'tournaments/*',
            element: (
              <RequireAuth user={user}>
                <Tournaments
                  user={user}
                  actorType={actorType}
                  membershipTier={tier}
                  clubUsername={clubUsername || undefined}
                />
              </RequireAuth>
            ),
            children: [
              { path: ':tournamentId', element: <TournamentOverview user={user} /> }
            ]
          },
          { path: 'challenges', element: (<RequireAuth user={user}><Challenges user={user} /></RequireAuth>) },
          { path: 'badges', element: (<RequireAuth user={user}><Badges user={user} /></RequireAuth>) },
          { path: 'submit-match', element: (<RequireAuth user={user}><SubmitMatch user={user} /></RequireAuth>) },
          { path: 'matches', element: (<RequireAuth user={user}><SubmitMatch user={user} /></RequireAuth>) },

          // ✅ Approvals inbox (players)
          { path: 'approvals', element: (<RequireAuth user={user}><PendingApprovals /></RequireAuth>) },

          // ✅ Admin-only Disputes
          { path: 'admin/disputes', element: (<RequireAdmin user={user}><AdminDisputes /></RequireAdmin>) },

          // ✅ NEW: Social (auth-required, lazy)
          {
            path: 'social',
            element: (
              <RequireAuth user={user}>
                <Suspense fallback={<div className="p-6 text-white/70">Loading Social…</div>}>
                  <SocialTab />
                </Suspense>
              </RequireAuth>
            )
          },

          // 404
          { path: '*', element: <div className="p-4 text-center text-xl">404 - Page Not Found</div> }
        ]
      }
    ],
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } }
  );
}

export default AppWrapper;
