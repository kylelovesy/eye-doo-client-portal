import { useAppStyles, useAppThemeColors } from '@/lib/useAppStyle';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ children, variant = 'primary', style, ...props }: ButtonProps) => {
  const colors = useAppThemeColors();
  const { spacing, borderRadius } = useAppStyles();

  const baseClasses = "font-bold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

  const computedStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          backgroundColor: colors.primary,
          color: colors.onPrimary,
          paddingBlock: spacing.sm,
          paddingInline: 24,
          borderRadius: borderRadius.md,
          ...style,
        }
      : {
          backgroundColor: colors.surfaceVariant,
          color: colors.onSurface,
          paddingBlock: spacing.sm,
          paddingInline: 24,
          borderRadius: borderRadius.md,
          ...style,
        };

  return (
    <button className={baseClasses} style={computedStyle} {...props}>
      {children}
    </button>
  );
};