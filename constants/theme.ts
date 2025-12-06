

export const colors = {
  // Bold primary colors
  primary: "#FF3B30",
  primaryDark: "#D62C23",
  secondary: "#FF9500",
  accent: "#00D4AA",
  
  // Backgrounds
  background: "#0A0A0A",
  surface: "#1A1A1A",
  surfaceLight: "#2A2A2A",
  
  // Text
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  textMuted: "#636366",
  
  // Status
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  
  // Categories
  chest: "#FF3B30",
  back: "#5856D6",
  legs: "#FF9500",
  shoulders: "#00D4AA",
  arms: "#FF2D55",
  core: "#5AC8FA",
  cardio: "#34C759",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  hero: {
    fontSize: 48,
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
};

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    chest: colors.chest,
    back: colors.back,
    legs: colors.legs,
    shoulders: colors.shoulders,

    arms: colors.arms,
    core: colors.core,
    cardio: colors.cardio,
  };
  return categoryColors[category.toLowerCase()] || colors.primary;
};

