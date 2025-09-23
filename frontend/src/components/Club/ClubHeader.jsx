import styles from './Club.module.css';

export default function ClubHeader({ club }) {
  const { name, banner_url, avatar_url, bio, location, social_links, subscription_tier } = club;

  const tierClass = {
    free: styles.tierFree,
    pro: styles.tierPro,
    premium: styles.tierPremium,
  };

  const tierLabel = {
    free: 'Basic Club',
    pro: 'Pro Club',
    premium: 'Elite Club',
  };

  return (
    <div
      className={styles.hero}
      style={{ backgroundImage: `url(${banner_url || '/assets/padel-bg.jpg'})` }}
    >
      <div className={styles.heroOverlay}>
        <img
          src={avatar_url || 'https://i.pravatar.cc/150?img=34'}
          className={styles.clubAvatar}
          alt="Club Avatar"
        />
        <h1>{name}</h1>
        <span className={`${styles.tierBadge} ${tierClass[subscription_tier]}`}>
          {tierLabel[subscription_tier]}
        </span>
        <p className={styles.bio}>{bio}</p>
        <p><strong>📍 Location:</strong> {location}</p>
        <div className={styles.links}>
          {social_links?.website && <a href={social_links.website}>Website</a>}
          {social_links?.instagram && <a href={social_links.instagram}>Instagram</a>}
          {social_links?.facebook && <a href={social_links.facebook}>Facebook</a>}
        </div>
      </div>
    </div>
  );
}