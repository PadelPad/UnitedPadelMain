import React, { useEffect } from 'react';
import './Legal.css';

const CookiePolicy = () => {
  useEffect(() => {
    document.body.classList.add('legal-page');
    return () => document.body.classList.remove('legal-page');
  }, []);

  return (
    <div className="legal-container">
      <h1>🍪 Cookie Policy</h1>
      <p><em>Last updated: August 3, 2025</em></p>

      <h2>1. Introduction</h2>
      <p>
        This Cookie Policy explains how United Padel uses cookies and similar technologies to recognize you when you visit our website at{' '}
        <strong>unitedpadel.co.uk</strong>. It outlines what these technologies are, why we use them, and your rights to control their use.
      </p>

      <h2>2. What Are Cookies?</h2>
      <p>
        Cookies are small text files that are placed on your device when you visit a website. They help us remember your preferences,
        analyze site traffic, and deliver personalized content and features.
      </p>

      <h2>3. Types of Cookies We Use</h2>
      <ul>
        <li><strong>Strictly Necessary Cookies:</strong> Required for basic site functionality, such as login sessions and form security.</li>
        <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site (e.g. Google Analytics).</li>
        <li><strong>Functionality Cookies:</strong> Remember user preferences like region and language.</li>
        <li><strong>Targeting/Advertising Cookies:</strong> May be used to show relevant ads based on browsing behavior (minimal on our platform).</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>
        We use third-party tools that may also place cookies on your device:
      </p>
      <ul>
        <li><strong>Google Analytics</strong> – For usage statistics and behavior insights</li>
        <li><strong>Stripe</strong> – For secure payment processing and fraud prevention</li>
        <li><strong>Hotjar or similar (if applicable)</strong> – To analyze user interaction (optional)</li>
      </ul>

      <h2>5. Consent Management</h2>
      <p>
        By using our website, you consent to the placement of cookies on your device unless you have disabled them. On your first visit,
        we present a cookie banner allowing you to accept or manage your preferences.
      </p>

      <h2>6. How to Manage Cookies</h2>
      <p>You can control cookies through:</p>
      <ul>
        <li>Your browser settings – block or delete cookies manually</li>
        <li>Our cookie banner – accept only essential or all cookies</li>
        <li>Using browser extensions that block tracking</li>
      </ul>
      <p>Note: Disabling cookies may affect functionality such as login, match submission, or saved preferences.</p>

      <h2>7. Data Collected via Cookies</h2>
      <p>
        Cookies may collect device IP address, browser type, page visits, session duration, and referral links. These are used solely to
        improve our service and will never be sold or shared without your consent.
      </p>

      <h2>8. Retention Period</h2>
      <p>
        Cookie data is stored for varying lengths depending on the type:
      </p>
      <ul>
        <li>Session cookies: deleted when you close your browser</li>
        <li>Persistent cookies: remain until they expire or are deleted (e.g. up to 1 year)</li>
      </ul>

      <h2>9. Your Rights Under GDPR</h2>
      <p>
        If you are located in the UK or EU, you have the right to:
      </p>
      <ul>
        <li>Withdraw cookie consent at any time</li>
        <li>Request access to any personal data collected via cookies</li>
        <li>Request deletion of data linked to cookies</li>
      </ul>
      <p>For requests, please contact us at <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.</p>

      <h2>10. Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. Any changes will be posted here and the effective date will be updated.
      </p>
    </div>
  );
};

export default CookiePolicy;
