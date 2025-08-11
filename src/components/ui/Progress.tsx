import React from 'react';
import styles from '@/app/portal.module.css';

export const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className={styles.progressBar}>
    <div className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);


