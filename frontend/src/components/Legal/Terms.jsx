import React, { useEffect } from 'react';
import './Legal.css';

const Terms = () => {
  useEffect(() => {
    document.body.classList.add('legal-page');
    return () => document.body.classList.remove('legal-page');
  }, []);
  return (
    <div className="legal-container">
      <h1>Terms of Service</h1>
      <p><em>Last updated: August 3, 2025</em></p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to United Padel. These Terms of Service (“Terms”) govern your access to and use of our digital padel platform, including the website, apps, leaderboard, tournaments, and related services (collectively, the “Service”). By creating an account or using United Padel, you agree to these Terms.
      </p>

      <h2>2. Eligibility & Account Creation</h2>
      <ul>
        <li>Be at least 13 years old</li>
        <li>Provide accurate personal information</li>
        <li>Maintain only one individual or club account unless otherwise authorized</li>
      </ul>
      <p>
        You are responsible for keeping your login credentials secure. United Padel is not liable for loss resulting from unauthorized access to your account.
      </p>

      <h2>3. Match Submissions & Leaderboards</h2>
      <ul>
        <li>You agree all match data is accurate and may be publicly displayed</li>
        <li>You consent to rating updates based on our Elo-based system</li>
        <li>You understand that falsifying results may lead to suspension or permanent ban</li>
      </ul>

      <h2>4. Avatar & Image Policy</h2>
      <p>Users may choose to upload a personal photo or select from preset avatars. By uploading a photo:</p>
      <ul>
        <li>You confirm you have the right to use that image</li>
        <li>You grant United Padel a license to store and display it on your profile and leaderboard</li>
        <li>Inappropriate or offensive images are strictly prohibited</li>
      </ul>

      <h2>5. Subscriptions & Payments</h2>
      <ul>
        <li>You authorize us (via Stripe) to charge your selected payment method</li>
        <li>Your subscription will auto-renew unless canceled</li>
        <li>Refunds are subject to our cancellation policy</li>
        <li>Plan features and pricing may be updated with prior notice</li>
      </ul>

      <h2>6. User Conduct</h2>
      <ul>
        <li>Harass, abuse, or impersonate others</li>
        <li>Upload or share illegal, harmful, or misleading content</li>
        <li>Use bots or automated scripts to interact with the platform</li>
        <li>Misuse referral codes or game the ranking system</li>
      </ul>
      <p>Violation of these rules may result in account termination.</p>

      <h2>7. Privacy</h2>
      <p>Your data is handled in accordance with our <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. We store and process your information securely and will never sell your data to third parties.</p>

      <h2>8. Platform Availability</h2>
      <p>
        United Padel aims to maintain consistent access to the platform, but we do not guarantee uninterrupted service. Maintenance, updates, and external factors may affect availability.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        United Padel is not liable for:
      </p>
      <ul>
        <li>Injuries or losses occurring in real-life matches</li>
        <li>Errors in match processing or ranking</li>
        <li>User-generated content</li>
      </ul>
      <p>Use of the platform is at your own risk.</p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the United Kingdom, without regard to conflict of law provisions. Any disputes shall be resolved under UK jurisdiction.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of United Padel after changes constitutes acceptance of the new Terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions? Contact us at <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.
      </p>
    </div>
  );
};

export default Terms;
