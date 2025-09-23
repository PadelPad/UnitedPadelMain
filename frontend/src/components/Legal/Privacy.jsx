import React, { useEffect } from 'react';
import './Legal.css';

const Privacy = () => {
  useEffect(() => {
    document.body.classList.add('legal-page');
    return () => document.body.classList.remove('legal-page');
  }, []);
  return (
    <div className="legal-container">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: August 3, 2025</em></p>

      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how United Padel collects, uses, and protects your personal information when you use our platform and services.
      </p>

      <h2>2. What We Collect</h2>
      <ul>
        <li>Email address, username, and password</li>
        <li>Phone number and location (region & city)</li>
        <li>Profile details including gender, avatar, and referral code</li>
        <li>Match history, performance data, and badge progress</li>
        <li>Payment/subscription data (via Stripe)</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To manage your account and profile</li>
        <li>To display your stats on the leaderboard and club pages</li>
        <li>To improve user experience and offer personalized features</li>
        <li>To send essential emails (e.g. verification, notifications)</li>
        <li>To process subscriptions and payments securely</li>
      </ul>

      <h2>4. Who We Share It With</h2>
      <p>
        We do <strong>not sell</strong> your data. We may share your data with:
      </p>
      <ul>
        <li>Trusted services like Stripe for payment processing</li>
        <li>Law enforcement if legally required</li>
        <li>Analytics platforms for usage insights (non-personalized)</li>
      </ul>

      <h2>5. Data Storage & Security</h2>
      <p>
        All personal data is stored securely via Supabase and encrypted at rest and in transit. We take steps to ensure your information is not accessed, altered, or deleted without your consent.
      </p>

      <h2>6. Your Rights</h2>
      <ul>
        <li>You can view, update, or delete your profile at any time</li>
        <li>You can request a full data export by emailing us</li>
        <li>You can close your account, which deletes all personal data</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        We use essential cookies for login sessions. Optional cookies (e.g. analytics) will only be used if consent is given.
      </p>

      <h2>8. Children’s Privacy</h2>
      <p>
        Users must be 13 years or older to create an account. If you are under 13, do not submit any personal information.
      </p>

      <h2>9. Updates to This Policy</h2>
      <p>
        We may revise this Privacy Policy as we grow. Updates will be posted here with a new effective date.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy-related requests, email <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.
      </p>
    </div>
  );
};

export default Privacy;
