// components/Subscriptions/SubscriptionPlans.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './SubscriptionPlans.css';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import bronzeBadge from '../../assets/badge-bronze.png';
import silverBadge from '../../assets/badge-silver.png';
import goldBadge from '../../assets/badge-gold.png';
import padelBg from '../../assets/padel-bg.jpg';
import { useNavigate } from 'react-router-dom';

const RAW_PLANS = [
  {
    title: 'Basic',
    ribbon: null,
    individualPrice: '£0',
    clubPrice: '£0',
    stripePriceId: {
      individual: 'price_1RS0EYRqoRyLHnko82DGyXIy',     // FREE (no Stripe used)
      club:       'price_1RS0EYRqoRyLHnkoCLUBFREE'      // FREE (no Stripe used)
    },
    badge: bronzeBadge,
    features: {
      individual: [
        'Join the Rankings',
        'Upload 2 Matches / month',
        'Access Bronze Badges'
      ],
      club: [
        'Free Club Profile (logo, bio, links)',
        'Basic Stats (wins, matches, win %)',
        'Listed in Club Directory'
      ]
    }
  },
  {
    title: 'Plus',
    ribbon: 'Most Popular',
    individualPrice: '£9.99',
    clubPrice: '£19.99',
    stripePriceId: {
      individual: 'price_1Rpv6HRvEGYvE2VtWCuBgoJs',
      club:       'price_1Rpv98RvEGYvE2VtxDrfd5fO'
    },
    badge: silverBadge,
    features: {
      individual: [
        'Upload 4 Matches / month',
        'Create 1 Tournament',
        'Access Silver Badges'
      ],
      club: [
        'Manage Club Rankings',
        'Custom Events & Ladders',
        'Core Analytics Dashboard'
      ]
    }
  },
  {
    title: 'Elite',
    ribbon: 'Best Value',
    individualPrice: '£19.99',
    clubPrice: '£39.99',
    stripePriceId: {
      individual: 'price_1Rpv7WRvEGYvE2VtGXoMKDds',
      club:       'price_1Rpv9pRvEGYvE2Vtd3JeJt4Z'
    },
    badge: goldBadge,
    features: {
      individual: [
        'Unlimited Uploads',
        'Priority Club Booking',
        'Access Gold Badges'
      ],
      club: [
        'Full Brand Exposure & Homepage Placement',
        'Leagues & Advanced Club Analytics',
        'Sponsor Showcase & Theme Controls'
      ]
    }
  }
];

export default function SubscriptionPlans({ user }) {
  const [type, setType] = useState('individual'); // 'individual' | 'club'
  const [currentTier, setCurrentTier] = useState(null); // 'basic' | 'plus' | 'elite'
  const [hasClub, setHasClub] = useState(false);
  const [loadingTier, setLoadingTier] = useState(true);
  const navigate = useNavigate();

  // Fetch the user’s current tier and whether they own a club
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingTier(true);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setCurrentTier(null);
        setHasClub(false);
        setLoadingTier(false);
        return;
      }

      // Do they own a club?
      const { data: club } = await supabase
        .from('clubs')
        .select('id,subscription_tier,subscription_plan')
        .eq('auth_user_id', uid)
        .maybeSingle();

      if (!alive) return;

      if (club?.id) {
        setHasClub(true);
        setCurrentTier((club.subscription_tier || club.subscription_plan || 'basic').toLowerCase());
        setType('club');
        setLoadingTier(false);
        return;
      }

      // Otherwise, use profile tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', uid)
        .maybeSingle();

      if (!alive) return;

      setHasClub(false);
      setCurrentTier((profile?.subscription_tier || 'basic').toLowerCase());
      setType('individual');
      setLoadingTier(false);
    })();

    return () => { alive = false; };
  }, []);

  const plans = useMemo(() => RAW_PLANS, []);

  const handleSubscribe = async (plan, chosenType) => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }

    const isFree = (chosenType === 'individual' ? plan.individualPrice : plan.clubPrice) === '£0';
    const priceId = plan.stripePriceId[chosenType];

    try {
      if (isFree) {
        // No Stripe flow: persist basic tier locally
        if (chosenType === 'club') {
          const { data: club } = await supabase
            .from('clubs')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (!club?.id) {
            alert('Create your club profile to activate Basic Club.');
            navigate('/register'); // or your club creation route
            return;
          }

          const { error: upErr } = await supabase
            .from('clubs')
            .update({ subscription_tier: 'basic', subscription_plan: 'basic' })
            .eq('auth_user_id', user.id);

          if (upErr) throw upErr;
        } else {
          const { error: upErr } = await supabase
            .from('profiles')
            .update({ subscription_tier: 'basic' })
            .eq('id', user.id);
          if (upErr) throw upErr;
        }

        alert('Basic plan activated!');
        window.location.reload();
        return;
      }

      // ========= Paid flow via your backend (with Authorization header) =========
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const { data } = await axios.post(
        'http://localhost:5000/api/subscriptions/create-checkout-session', // plural 'subscriptions'
        { priceId, userId: user.id, accountType: chosenType },
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        }
      );

      // On success, redirect to Stripe Checkout
      window.location.href = data?.url;
      // ==========================================================================
    } catch (err) {
      console.error(err);
      alert('Failed to start subscription. Please try again.');
    }
  };

  const tierToKey = (t) => (t || '').toLowerCase();
  const userOnThisTier = (plan) => {
    if (!currentTier) return false;
    return tierToKey(plan.title) === tierToKey(currentTier);
  };

  return (
    <div className="subscription-wrapper" style={{ backgroundImage: `url(${padelBg})` }}>
      <div className="subscription-container">
        <h1 className="subscription-heading">Unlock Your Padel Potential</h1>
        <p className="subscription-subtext">
          Choose a membership that matches your ambition—<br />for individuals and clubs.
        </p>

        <div className="toggle-wrapper" role="tablist" aria-label="Plan type">
          <button
            className={`toggle-btn ${type === 'individual' ? 'active' : ''}`}
            onClick={() => setType('individual')}
            role="tab"
            aria-selected={type === 'individual'}
          >
            Individual
          </button>
          <button
            className={`toggle-btn ${type === 'club' ? 'active' : ''}`}
            onClick={() => setType('club')}
            role="tab"
            aria-selected={type === 'club'}
          >
            Club
          </button>
        </div>

        <div className="subscription-grid">
          {plans.map((plan) => {
            const isThisTier = userOnThisTier(plan);
            const price =
              type === 'individual' ? plan.individualPrice : plan.clubPrice;

            return (
              <div className={`plan-card ${plan.ribbon ? 'with-ribbon' : ''}`} key={plan.title}>
                {plan.ribbon && <div className="ribbon">{plan.ribbon}</div>}
                <img src={plan.badge} alt={`${plan.title} badge`} className="badge-img" />
                <h3>{plan.title}</h3>

                <p className="plan-price">
                  {price}/month
                </p>

                <div className="plan-description">
                  <ul>
                    {plan.features[type].map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <button
                  className="subscribe-btn"
                  onClick={() => handleSubscribe(plan, type)}
                  disabled={loadingTier || isThisTier}
                  aria-disabled={loadingTier || isThisTier}
                  title={isThisTier ? 'You are on this plan' : 'Subscribe'}
                >
                  {isThisTier ? 'Current Plan' : 'Subscribe'}
                </button>

                {/* Friendly note to steer Clubs without a profile */}
                {type === 'club' && plan.title === 'Basic' && !hasClub && (
                  <button
                    className="ghost-btn"
                    onClick={() => navigate('/register')}
                  >
                    Create a Club Profile
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="fineprint">
          You can upgrade or downgrade anytime. Paid plans renew monthly.
        </div>
      </div>
    </div>
  );
}
