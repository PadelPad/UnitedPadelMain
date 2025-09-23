import React, { useEffect } from 'react';
import './Legal.css';

const RefundPolicy = () => {
  useEffect(() => {
    document.body.classList.add('legal-page');
    return () => document.body.classList.remove('legal-page');
  }, []);

  return (
    <div className="legal-container">
      <h1>🧾 Refund & Cancellation Policy</h1>
      <p><em>Effective Date: August 3, 2025</em></p>

      <h2>1. Overview</h2>
      <p>
        United Padel provides digital services, including subscriptions and premium memberships, billed via our payment provider (Stripe).
        This policy outlines your rights regarding refunds, cancellations, billing errors, and disputes.
      </p>

      <h2>2. Subscription Billing</h2>
      <ul>
        <li>All paid subscriptions (e.g. Club+, Individual+) are billed in advance and renew automatically unless cancelled.</li>
        <li>You can view, manage, or cancel your subscription anytime via your <strong>Account Settings</strong>.</li>
        <li>Prices may vary by region and are clearly stated before payment confirmation.</li>
      </ul>

      <h2>3. Cancellation Policy</h2>
      <ul>
        <li>You may cancel your subscription at any time. Upon cancellation, your subscription will remain active until the end of the billing period.</li>
        <li>No further charges will occur after cancellation unless you resubscribe manually.</li>
        <li>We do not offer partial refunds for unused time within a billing cycle unless required by law.</li>
      </ul>

      <h2>4. Refund Eligibility</h2>
      <p>Refunds may be issued at our discretion in the following cases:</p>
      <ul>
        <li>You were charged in error (e.g. duplicate or unauthorized transactions)</li>
        <li>There was a verified service disruption that impacted your ability to use paid features</li>
        <li>You cancelled shortly after subscribing but did not access premium features</li>
      </ul>
      <p>
        Refund requests must be made within <strong>14 days</strong> of the transaction by emailing{' '}
        <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.
      </p>

      <h2>5. Chargebacks</h2>
      <p>
        Filing a chargeback with your bank or card issuer without contacting our team first may result in suspension of your United Padel account.
        We encourage you to resolve disputes directly with us so we can assist promptly and fairly.
      </p>

      <h2>6. Stripe & Payment Security</h2>
      <ul>
        <li>All transactions are securely processed via <strong>Stripe</strong>, our PCI-compliant payment partner.</li>
        <li>Your card details are never stored on United Padel servers.</li>
        <li>Stripe's terms may also apply. Visit <a href="https://stripe.com/legal">stripe.com/legal</a> for more information.</li>
      </ul>

      <h2>7. No Refunds For:</h2>
      <ul>
        <li>Failure to cancel before the renewal date</li>
        <li>Discontent with features clearly outlined in the plan</li>
        <li>Loss of ranking or match stats due to inactivity</li>
        <li>Bans or suspensions caused by violation of our <a href="/terms">Terms of Service</a></li>
      </ul>

      <h2>8. Contact</h2>
      <p>
        For refund inquiries, cancellation help, or billing disputes, contact our support team at{' '}
        <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.
      </p>
    </div>
  );
};

export default RefundPolicy;