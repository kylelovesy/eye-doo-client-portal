"use client";

// Typography scale adapted from constants/typography.ts (Material Design 3)

export type TypographyScale = ReturnType<typeof createTypography>;

export const SansConfig = {
  regular: 'var(--font-sans)',
  medium: 'var(--font-sans)',
  semiBold: 'var(--font-sans)',
  bold: 'var(--font-sans)',
};

export const SerifConfig = {
  medium: 'var(--font-serif)',
  bold: 'var(--font-serif)',
};

export const createTypography = () => ({
  displayLarge: { fontFamily: SerifConfig.bold, fontSize: 57, lineHeight: '64px', letterSpacing: -0.25 as number },
  displayMedium: { fontFamily: SerifConfig.bold, fontSize: 45, lineHeight: '52px', letterSpacing: 0 },
  displaySmall: { fontFamily: SerifConfig.bold, fontSize: 36, lineHeight: '44px', letterSpacing: 0 },

  headlineLarge: { fontFamily: SerifConfig.bold, fontSize: 32, lineHeight: '40px', letterSpacing: 0 },
  headlineMedium: { fontFamily: SerifConfig.medium, fontSize: 28, lineHeight: '36px', letterSpacing: 0 },
  headlineSmall: { fontFamily: SerifConfig.medium, fontSize: 24, lineHeight: '32px', letterSpacing: 0 },

  titleLarge: { fontFamily: SerifConfig.bold, fontSize: 22, lineHeight: '28px', letterSpacing: 0 },
  titleMedium: { fontFamily: SerifConfig.medium, fontSize: 16, lineHeight: '22px', letterSpacing: 0.15 },
  titleSmall: { fontFamily: SerifConfig.medium, fontSize: 14, lineHeight: '18px', letterSpacing: 0.1 },

  bodyBold: { fontFamily: SansConfig.semiBold, fontSize: 16, lineHeight: '24px', letterSpacing: 0.15 },
  bodyLarge: { fontFamily: SansConfig.regular, fontSize: 16, lineHeight: '24px', letterSpacing: 0.15 },
  bodyMedium: { fontFamily: SansConfig.regular, fontSize: 14, lineHeight: '20px', letterSpacing: 0.25 },
  bodySmall: { fontFamily: SansConfig.regular, fontSize: 12, lineHeight: '16px', letterSpacing: 0.4 },

  labelLarge: { fontFamily: SansConfig.medium, fontSize: 14, lineHeight: '20px', letterSpacing: 0.1 },
  labelMedium: { fontFamily: SansConfig.medium, fontSize: 12, lineHeight: '16px', letterSpacing: 0.5 },
  labelSmall: { fontFamily: SansConfig.medium, fontSize: 11, lineHeight: '16px', letterSpacing: 0.5 },
});


