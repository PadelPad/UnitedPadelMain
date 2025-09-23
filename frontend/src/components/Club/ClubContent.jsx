import styles from './Club.module.css';

export default function ClubContent({ club }) {
  const { coaches = [], gallery_images = [], stats = {} } = club;

  return (
    <div className={styles.section}>
      <h2>Our Coaches</h2>
      <div className={styles.coachGrid}>
        {coaches.map((coach, idx) => (
          <div key={idx} className={styles.coachCard}>
            <img src={coach.photo} alt={coach.name} />
            <h4>{coach.name}</h4>
            <p>{coach.bio}</p>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Gallery</h2>
      <div className={styles.galleryGrid}>
        {gallery_images.map((img, i) => (
          <img key={i} src={img} className={styles.galleryImage} alt={`Gallery ${i}`} />
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Club Stats</h2>
      <ul className={styles.statsList}>
        <li>🏆 Total Wins: {stats.total_wins}</li>
        <li>📅 Matches Played: {stats.matches_played}</li>
        <li>🔥 Win Rate: {stats.win_rate}%</li>
      </ul>
    </div>
  );
}