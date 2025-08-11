import React, { useEffect, useRef } from 'react';
import styles from '@/app/portal.module.css';

export const FloatingHearts: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let intervalId: number | null = null;

    const createHeart = () => {
      const heart = document.createElement('div');
      heart.className = styles.heart;
      heart.innerHTML = '♡';
      heart.style.left = Math.random() * 100 + '%';
      const duration = Math.random() * 3 + 5;
      heart.style.animationDuration = `${duration}s`;
      heart.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(heart);
      window.setTimeout(() => heart.remove(), (duration + 1) * 1000);
    };

    intervalId = window.setInterval(createHeart, 3000);
    return () => { if (intervalId) window.clearInterval(intervalId); };
  }, []);

  return <div ref={containerRef} className={styles.floatingHearts} aria-hidden="true" />;
};


