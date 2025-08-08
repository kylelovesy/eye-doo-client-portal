"use client";

import { borderRadius, spacing } from "./styles";
import { useAppTheme } from "./theme";
import { createTypography } from "./typography";

export const useAppStyles = () => {
  const theme = useAppTheme();
  const typography = createTypography();

  return {
    theme,
    styles: {},
    commonStyles: {},
    typography,
    spacing,
    borderRadius,
  };
};

export const useAppThemeColors = () => useAppTheme().colors;

export const useTypography = () => {
  const { colors } = useAppTheme();
  const t = createTypography();

  return {
    displayLarge: { ...t.displayLarge, color: colors.onBackground },
    displayMedium: { ...t.displayMedium, color: colors.onBackground },
    displaySmall: { ...t.displaySmall, color: colors.onBackground },
    headlineLarge: { ...t.headlineLarge, color: colors.onBackground },
    headlineMedium: { ...t.headlineMedium, color: colors.onBackground },
    headlineSmall: { ...t.headlineSmall, color: colors.onBackground },
    titleLarge: { ...t.titleLarge, color: colors.onSurface },
    titleMedium: { ...t.titleMedium, color: colors.onSurface },
    titleSmall: { ...t.titleSmall, color: colors.onSurface },
    bodyLarge: { ...t.bodyLarge, color: colors.onSurface },
    bodyMedium: { ...t.bodyMedium, color: colors.onSurface },
    bodySmall: { ...t.bodySmall, color: colors.onSurface },
    labelLarge: { ...t.labelLarge, color: colors.onSurface },
    labelMedium: { ...t.labelMedium, color: colors.onSurface },
    labelSmall: { ...t.labelSmall, color: colors.onSurface },
    onSurfaceVariant: {
      bodyLarge: { ...t.bodyLarge, color: colors.onSurfaceVariant },
      bodyMedium: { ...t.bodyMedium, color: colors.onSurfaceVariant },
      bodySmall: { ...t.bodySmall, color: colors.onSurfaceVariant },
    },
    primary: {
      titleLarge: { ...t.titleLarge, color: colors.primary },
      titleMedium: { ...t.titleMedium, color: colors.primary },
      bodyLarge: { ...t.bodyLarge, color: colors.primary },
    },
    error: {
      titleMedium: { ...t.titleMedium, color: colors.error },
      bodyMedium: { ...t.bodyMedium, color: colors.error },
    },
  };
};


