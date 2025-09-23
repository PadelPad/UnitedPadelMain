// /src/components/Profile/SocialLinks.jsx
import "./Profile.css";

export default function SocialLinks({ links }) {
  const hasAny =
    !!links?.instagram || !!links?.facebook || !!links?.website;

  return (
    <div className="socialSection" aria-live="polite">
      <h3>Connect</h3>

      {hasAny ? (
        <div className="socialLinksVertical">
          {links.instagram && (
            <a href={links.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              📸 Instagram
            </a>
          )}
          {links.facebook && (
            <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              🔵 Facebook
            </a>
          )}
          {links.website && (
            <a href={links.website} target="_blank" rel="noreferrer" aria-label="Website">
              🌐 Website
            </a>
          )}
        </div>
      ) : (
        <div className="emptyState">
          <p>No social links yet.</p>
          <p style={{ opacity: 0.8, marginTop: 4 }}>
            Add Instagram, Facebook, or a website in Account Settings.
          </p>
        </div>
      )}
    </div>
  );
}
