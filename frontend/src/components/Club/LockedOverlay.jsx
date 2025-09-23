import React from 'react';
import styles from './LockedOverlay.module.css';

export default function LockedOverlay({ label = 'Upgrade to unlock', onClick }) {
  return (
    <div className={styles.overlay} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.inner}>
        <span className={styles.icon}>🔒</span>
        <p>{label}</p>
        <button className={styles.btn} type="button">Upgrade</button>
      </div>
    </div>
  );
}
