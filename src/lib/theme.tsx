"use client";

// Web theme adapted from constants/theme.ts in the main app

export type Elevation = {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
};

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  background: string;
  onBackground: string;

  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  outline: string;
  outlineVariant: string;

  shadow: string;
  scrim: string;

  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  elevation: Elevation;

  surfaceDisabled: string;
  onSurfaceDisabled: string;
  backdrop: string;
};

export type AppTheme = {
  colors: ThemeColors;
};

const lightThemeColors: ThemeColors = {
  primary: "#6B8E23", // A more elegant, earthy green
  onPrimary: "#FFFFFF",
  primaryContainer: "#E8F5E9",
  onPrimaryContainer: "#1B5E20",

  secondary: "#D4A76A",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFF2D1",
  onSecondaryContainer: "#3D2B00",

  tertiary: "#A1887F", // A soft, warm grey
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#F5F5F5",
  onTertiaryContainer: "#4E342E",

  error: "#C62828",
  onError: "#FFFFFF",
  errorContainer: "#FFEBEE",
  onErrorContainer: "#B71C1C",

  background: "#F5F5F5",
  onBackground: "#1A1A1A",

  surface: "#FFFFFF",
  onSurface: "#1A1A1A",
  surfaceVariant: "#E9ECEF",
  onSurfaceVariant: "#6C757D",

  outline: "#CEDBE8",
  outlineVariant: "#E1E8ED",

  shadow: "#000000",
  scrim: "#000000",

  inverseSurface: "#2F3033",
  inverseOnSurface: "#F0F0F3",
  inversePrimary: "#A5C8FF",

  elevation: {
    level0: "transparent",
    level1: "#FFFFFF",
    level2: "#F8F9FA",
    level3: "#F1F3F4",
    level4: "#ECEFF1",
    level5: "#E8EBF0",
  },

  surfaceDisabled: "rgba(26, 26, 26, 0.12)",
  onSurfaceDisabled: "rgba(26, 26, 26, 0.38)",
  backdrop: "rgba(44, 49, 55, 0.4)",
};

const darkThemeColors: ThemeColors = {
  primary: "#A5D6A7", // A lighter green for dark mode
  onPrimary: "#1B5E20",
  primaryContainer: "#2E7D32",
  onPrimaryContainer: "#E8F5E9",

  secondary: "#D4A76A",
  onSecondary: "#402D00",
  secondaryContainer: "#4A3A00",
  onSecondaryContainer: "#FFF2D1",

  tertiary: "#BDBDBD", // A lighter grey for dark mode
  onTertiary: "#4E342E",
  tertiaryContainer: "#616161",
  onTertiaryContainer: "#F5F5F5",

  error: "#EF9A9A",
  onError: "#B71C1C",
  errorContainer: "#C62828",
  onErrorContainer: "#FFEBEE",

  background: "#121212",
  onBackground: "#E9ECEF",

  surface: "#1E1E1E",
  onSurface: "#E9ECEF",
  surfaceVariant: "#424242",
  onSurfaceVariant: "#BDBDBD",

  outline: "#9E9E9E",
  outlineVariant: "#616161",

  shadow: "#000000",
  scrim: "#000000",

  inverseSurface: "#E9ECEF",
  inverseOnSurface: "#2E3036",
  inversePrimary: "#4A90E2",

  elevation: {
    level0: "transparent",
    level1: "#1F1F1F",
    level2: "#232323",
    level3: "#282828",
    level4: "#2C2C2C",
    level5: "#2F2F2F",
  },

  surfaceDisabled: "rgba(233, 236, 239, 0.12)",
  onSurfaceDisabled: "rgba(233, 236, 239, 0.38)",
  backdrop: "rgba(0, 0, 0, 0.5)",
};


export const AppLightTheme: AppTheme = {
  colors: lightThemeColors,
};

export const AppDarkTheme: AppTheme = {
  colors: darkThemeColors,
};

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext<AppTheme>(AppLightTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsDark("matches" in e ? e.matches : (e as MediaQueryList).matches);
    handler(media);
    media.addEventListener("change", handler as (ev: MediaQueryListEvent) => void);
    return () => media.removeEventListener("change", handler as (ev: MediaQueryListEvent) => void);
  }, []);

  const value = useMemo(() => (isDark ? AppDarkTheme : AppLightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
// "use client";

// // Web theme adapted from constants/theme.ts in the main app

// export type Elevation = {
//   level0: string;
//   level1: string;
//   level2: string;
//   level3: string;
//   level4: string;
//   level5: string;
// };

// export type ThemeColors = {
//   primary: string;
//   onPrimary: string;
//   primaryContainer: string;
//   onPrimaryContainer: string;

//   secondary: string;
//   onSecondary: string;
//   secondaryContainer: string;
//   onSecondaryContainer: string;

//   tertiary: string;
//   onTertiary: string;
//   tertiaryContainer: string;
//   onTertiaryContainer: string;

//   error: string;
//   onError: string;
//   errorContainer: string;
//   onErrorContainer: string;

//   background: string;
//   onBackground: string;

//   surface: string;
//   onSurface: string;
//   surfaceVariant: string;
//   onSurfaceVariant: string;

//   outline: string;
//   outlineVariant: string;

//   shadow: string;
//   scrim: string;

//   inverseSurface: string;
//   inverseOnSurface: string;
//   inversePrimary: string;

//   elevation: Elevation;

//   surfaceDisabled: string;
//   onSurfaceDisabled: string;
//   backdrop: string;
// };

// export type AppTheme = {
//   colors: ThemeColors;
// };

// const lightThemeColors: ThemeColors = {
//   primary: "#4A90E2",
//   onPrimary: "#FFFFFF",
//   primaryContainer: "#D0E4FF",
//   onPrimaryContainer: "#001D36",

//   secondary: "#D4A76A",
//   onSecondary: "#FFFFFF",
//   secondaryContainer: "#FFF2D1",
//   onSecondaryContainer: "#3D2B00",

//   tertiary: "#6B8E23",
//   onTertiary: "#FFFFFF",
//   tertiaryContainer: "#D4E3FF",
//   onTertiaryContainer: "#222F00",

//   error: "#C44536",
//   onError: "#FFFFFF",
//   errorContainer: "#FFDAD6",
//   onErrorContainer: "#410002",

//   background: "#F5F5F5",
//   onBackground: "#1A1A1A",

//   surface: "#FFFFFF",
//   onSurface: "#1A1A1A",
//   surfaceVariant: "#E9ECEF",
//   onSurfaceVariant: "#6C757D",

//   outline: "#CEDBE8",
//   outlineVariant: "#E1E8ED",

//   shadow: "#000000",
//   scrim: "#000000",

//   inverseSurface: "#2F3033",
//   inverseOnSurface: "#F0F0F3",
//   inversePrimary: "#A5C8FF",

//   elevation: {
//     level0: "transparent",
//     level1: "#FFFFFF",
//     level2: "#F8F9FA",
//     level3: "#F1F3F4",
//     level4: "#ECEFF1",
//     level5: "#E8EBF0",
//   },

//   surfaceDisabled: "rgba(26, 26, 26, 0.12)",
//   onSurfaceDisabled: "rgba(26, 26, 26, 0.38)",
//   backdrop: "rgba(44, 49, 55, 0.4)",
// };

// const darkThemeColors: ThemeColors = {
//   primary: "#4A90E2",
//   onPrimary: "#003258",
//   primaryContainer: "#004F55",
//   onPrimaryContainer: "#A5EAF1",

//   secondary: "#D4A76A",
//   onSecondary: "#402D00",
//   secondaryContainer: "#4A3A00",
//   onSecondaryContainer: "#FFF2D1",

//   tertiary: "#9CCBFF",
//   onTertiary: "#003258",
//   tertiaryContainer: "#254766",
//   onTertiaryContainer: "#D4E3FF",

//   error: "#FFB4AB",
//   onError: "#690005",
//   errorContainer: "#93000A",
//   onErrorContainer: "#FFDAD6",

//   background: "#1A1A1A",
//   onBackground: "#E9ECEF",

//   surface: "#1A1A1A",
//   onSurface: "#E9ECEF",
//   surfaceVariant: "#41484D",
//   onSurfaceVariant: "#C1C8CE",

//   outline: "#8C959D",
//   outlineVariant: "#41484D",

//   shadow: "#000000",
//   scrim: "#000000",

//   inverseSurface: "#E9ECEF",
//   inverseOnSurface: "#2E3036",
//   inversePrimary: "#4A90E2",

//   elevation: {
//     level0: "transparent",
//     level1: "#1F1F1F",
//     level2: "#232323",
//     level3: "#282828",
//     level4: "#2C2C2C",
//     level5: "#2F2F2F",
//   },

//   surfaceDisabled: "rgba(233, 236, 239, 0.12)",
//   onSurfaceDisabled: "rgba(233, 236, 239, 0.38)",
//   backdrop: "rgba(44, 49, 55, 0.4)",
// };

// export const AppLightTheme: AppTheme = {
//   colors: lightThemeColors,
// };

// export const AppDarkTheme: AppTheme = {
//   colors: darkThemeColors,
// };

// import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// const ThemeContext = createContext<AppTheme>(AppLightTheme);

// export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [isDark, setIsDark] = useState(false);

//   useEffect(() => {
//     const media = window.matchMedia("(prefers-color-scheme: dark)");
//     const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsDark("matches" in e ? e.matches : (e as MediaQueryList).matches);
//     handler(media);
//     media.addEventListener("change", handler as (ev: MediaQueryListEvent) => void);
//     return () => media.removeEventListener("change", handler as (ev: MediaQueryListEvent) => void);
//   }, []);

//   const value = useMemo(() => (isDark ? AppDarkTheme : AppLightTheme), [isDark]);

//   return (
//     <ThemeContext.Provider value={value}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useAppTheme = () => useContext(ThemeContext);


