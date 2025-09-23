import styles from './Club.module.css';

export default function ClubHighlights({ club }) {
  const { trophies = [], upcoming_events = [] } = club;

  return (
    <div className={styles.section}>
      <h2>Trophy Wall 🏅</h2>
      <ul className={styles.trophyList}>
        {trophies.map((trophy, i) => (
          <li key={i}>
            <strong>{trophy.title}</strong> — {trophy.year}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: '2rem' }}>Upcoming Events</h2>
      <ul className={styles.eventList}>
        {upcoming_events.map((event, i) => (
          <li key={i}>
            <strong>{event.title}</strong> — {event.date} at {event.time}
          </li>
        ))}
      </ul>
    </div>
  );
}