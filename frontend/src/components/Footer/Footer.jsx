import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-columns">
<div>
  <h4>Documentation</h4>
  <ul>
    <li><a href="/child-protection">Child Protection</a></li>
    <li><a href="/photo-consent">Photo Consent</a></li>
    <li><a href="/refund-policy">Refund Policy</a></li>
    <li><a href="/cookie-policy">Cookie Policy</a></li>
  </ul>
</div>

        <div>
          <h4>Support & Terms</h4>
          <ul>
            <li><a href="mailto:support@unitedpadel.uk">Contact Us</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <li><a href="/tournaments">Tournaments</a></li>
            <li><a href="/pricing">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4>Follow Us</h4>
          <ul className="social-links">
            <li><a href="#">Instagram</a></li>
            <li><a href="#">TikTok</a></li>
            <li><a href="#">LinkedIn</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-partners">
        <h5>Official Partners</h5>
        <div className="partners-logos">
          <img src="/assets/partner1.png" alt="Partner 1" />
          <img src="/assets/partner2.png" alt="Partner 2" />
          <img src="/assets/partner3.png" alt="Partner 3" />
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 United Padel. All rights reserved.</p>
      </div>
    </footer>
  );
}