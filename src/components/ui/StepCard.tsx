import React from 'react';
import styles from '@/app/portal.module.css';

type StepCardProps = {
  stepNumber?: number | string;
  completed?: boolean;
  finalStep?: boolean;
  title: string;
  subtitle?: string;
  progress?: number; // 0-100
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  completed = false,
  finalStep = false,
  title,
  subtitle,
  progress,
  description,
  children,
  footer,
}) => {
  return (
    <section className={`${styles.stepCard} ${completed ? styles.completed : ''} ${finalStep ? styles.final : ''}`}>
      <div className={styles.stepHeader}>
        {stepNumber !== undefined && (
          <div className={`${styles.stepNumber} ${completed ? styles.stepNumberCompleted : ''}`}>
            {completed ? '✓' : stepNumber}
          </div>
        )}
      </div>

      <h2 className={styles.stepTitle}>{title}</h2>
      {subtitle && <p className={styles.stepSubtitle}>{subtitle}</p>}

      {typeof progress === 'number' && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}

      {description && <p className={styles.stepDescription}>{description}</p>}

      {children}

      {footer && <div className={styles.navigation}>{footer}</div>}
    </section>
  );
};


