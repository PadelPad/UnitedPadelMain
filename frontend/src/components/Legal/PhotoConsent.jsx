import React, { useEffect } from 'react';
import './Legal.css';

const PhotoConsent = () => {
  useEffect(() => {
    document.body.classList.add('legal-page');
    return () => document.body.classList.remove('legal-page');
  }, []);

  return (
    <div className="legal-container">
      <h1>📸 Photo Upload & Avatar Consent</h1>
      <p><em>Last updated: August 3, 2025</em></p>

      <h2>1. Overview</h2>
      <p>
        This policy outlines how United Padel handles images you upload to your user profile, including profile pictures, avatars, and
        any media submitted through our platform. By uploading a photo or selecting an avatar, you agree to the terms below.
      </p>

      <h2>2. Consent to Display</h2>
      <p>
        By uploading a photo or choosing a preset avatar, you grant United Padel a non-exclusive, worldwide license to:
      </p>
      <ul>
        <li>Store the image securely via our hosting provider (Supabase)</li>
        <li>Display the image on your public profile, leaderboard, or club profile</li>
        <li>Use the image in features directly related to user identity and gamification (e.g. badges, ranking visuals)</li>
      </ul>

      <h2>3. What You Must Agree To</h2>
      <ul>
        <li>You have the legal right to use the image</li>
        <li>The image does not contain offensive, copyrighted, or misleading content</li>
        <li>If the image includes other individuals, you have their permission to upload it</li>
      </ul>

      <h2>4. Underage Users</h2>
      <p>
        Users under 16 should only upload a photo with parental or guardian permission. For users under 13, we require explicit parental consent
        for any personal data, including photos. Where consent is not verifiable, we recommend using one of our preset avatars.
      </p>

      <h2>5. Use Restrictions</h2>
      <p>
        We will <strong>never</strong> use your uploaded photo for:
      </p>
      <ul>
        <li>Marketing or promotional materials without written consent</li>
        <li>Selling to third parties or advertisers</li>
        <li>Artificial intelligence training or facial recognition services</li>
      </ul>

      <h2>6. Removal and Control</h2>
      <p>
        You can remove or change your photo at any time via your profile settings. If you choose to delete your account, your image will be
        permanently removed from our systems within 30 days unless legal obligations require otherwise.
      </p>

      <h2>7. Storage & Security</h2>
      <p>
        All images are stored in the Supabase storage system with restricted access. Photos are linked only to your unique user ID and are never
        accessible by other users unless made public as part of your profile or leaderboard position.
      </p>

      <h2>8. Your Rights</h2>
      <ul>
        <li>Request a copy of any stored media linked to your account</li>
        <li>Request permanent deletion of uploaded content</li>
        <li>Withdraw consent to display your image at any time</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{' '}
        <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.
      </p>

      <h2>9. Updates to This Policy</h2>
      <p>
        We may update this policy to reflect platform changes or legal requirements. All updates will be posted here with an updated effective date.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have any concerns or questions about your photo data, please contact our team at{' '}
        <a href="mailto:support@unitedpadel.co.uk">support@unitedpadel.co.uk</a>.
      </p>
    </div>
  );
};

export default PhotoConsent;
