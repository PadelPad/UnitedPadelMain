import React, { useEffect } from 'react';
import './Legal.css';

const ChildProtection = () => {
  useEffect(() => {
    document.body.classList.add('legal-page');
    return () => document.body.classList.remove('legal-page');
  }, []);

  return (
    <div className="legal-container">
      <h1>🧒 Child Protection Policy</h1>
      <p><em>Last updated: August 3, 2025</em></p>

      <h2>1. Minimum Age Requirements</h2>
      <p>
        Users must be <strong>13 years or older</strong> to create an account on United Padel.
        Users under 16 are encouraged to use the platform only <strong>with parental guidance</strong>.
        Any accounts found with falsified age information may be suspended or removed.
      </p>

      <h2>2. Parental Consent</h2>
      <p>
        We do <strong>not knowingly collect personal data</strong> from children under 13 without verified parental consent.
        If we learn that data has been collected without proper consent, we will delete it immediately upon request.
      </p>

      <h2>3. Data Collection and Use</h2>
      <ul>
        <li>Only essential data is collected: username, date of birth, region, avatar, etc.</li>
        <li>All data is securely stored using Supabase and encrypted in transit.</li>
        <li>Children’s data is <strong>never sold or shared</strong> with third parties.</li>
      </ul>

      <h2>4. Inappropriate Content & Reporting</h2>
      <p>
        We maintain a strict zero-tolerance policy for abusive or harmful behavior on our platform.
        If you witness any inappropriate behavior or content, please report it immediately via our{' '}
        <a href="mailto:support@unitedpadel.co.uk">contact form</a>.
      </p>

      <h2>5. Moderation and Monitoring</h2>
      <ul>
        <li>All profiles, matches, and posts are monitored by both moderators and automated systems.</li>
        <li>Suspicious or offensive content will be flagged and reviewed.</li>
        <li>Repeat or serious violations may result in a permanent ban.</li>
      </ul>

      <h2>6. Parental Rights</h2>
      <p>Parents and legal guardians may:</p>
      <ul>
        <li>Request access to their child’s account or data</li>
        <li>Request data removal or full account deletion</li>
        <li>Submit concerns to <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a></li>
      </ul>

      <h2>7. Changes to This Policy</h2>
      <p>
        This policy may be updated to reflect changes in law or platform features. Updates will be posted here
        with a new “last updated” date.
      </p>
    </div>
  );
};

export default ChildProtection;