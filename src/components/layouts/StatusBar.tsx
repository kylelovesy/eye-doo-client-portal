import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import styles from '@/app/portal.module.css';
import { Button } from '../ui/Button';

interface StatusBarProps {
  currentStep: number;
  steps: { id: string; title: string; description: string }[];
  onNext: () => void;
  onPrev: () => void;
}

export const StatusBar = ({ currentStep, steps, onNext, onPrev }: StatusBarProps) => {
  const step = steps[currentStep];
  const colors = useAppThemeColors();
  const t = useTypography();

  return (
    <div className="p-6 rounded-lg mb-8 text-center shadow" style={{ backgroundColor: colors.surface }}>
      <h3 style={{ ...t.titleLarge }}>{step.title}</h3>
      {/* <p style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8, marginBottom: 16 }}>{step.description}</p> */}
      <div className={`${styles.progressBar} mb-4`}>
        <div className={styles.progressFill} style={{ width: `${Math.round(((currentStep + 1) / steps.length) * 100)}%` }} />
      </div>
      <div className="flex justify-center items-center space-x-4 mt-3">
        <button
          onClick={onPrev}
          style={{ ...t.labelLarge, color: colors.onSurfaceVariant, visibility: currentStep === 0 ? 'hidden' : 'visible' }}
          aria-label="Go to previous step"
        >
          &larr; Previous
        </button>
        <Button
          onClick={onNext}
          style={{ visibility: currentStep >= steps.length - 1 ? 'hidden' : 'visible' }}
          aria-label="Go to next step"
        >
          Next Step &rarr;
        </Button>
      </div>
    </div>
  );
};