import { useAppThemeColors } from '@/lib/useAppStyle';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ children, variant = 'primary', style, ...props }: ButtonProps) => {
  const colors = useAppThemeColors();
  // const { spacing, borderRadius } = useAppStyles();

  const baseClasses = "font-bold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

  const computedStyle: React.CSSProperties =
    variant === 'primary'
    ? {
      backgroundColor: colors.primary,
      color: colors.onPrimary,
      padding: '12px 24px', // Increased padding
      borderRadius: '8px',   // Slightly reduced radius
      ...style,
    }
  : {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
      padding: '12px 24px',
      borderRadius: '8px',
      ...style,
    };
      // ? {
      //     backgroundColor: colors.primary,
      //     color: colors.onPrimary,
      //     paddingBlock: spacing.sm,
      //     paddingInline: 24,
      //     borderRadius: borderRadius.sm,
      //     ...style,
      //   }
      // : {
      //     backgroundColor: colors.surfaceVariant,
      //     color: colors.onSurface,
      //     paddingBlock: spacing.sm,
      //     paddingInline: 24,
      //     borderRadius: borderRadius.sm,
      //     ...style,
      //   };

  return (
    <button className={baseClasses} style={computedStyle} {...props}>
      {children}
    </button>
  );
};