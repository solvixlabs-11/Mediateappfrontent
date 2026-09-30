/**
 * Design system tokens from design.md
 */

export const colors = {
  primary: "#0E8C7F",
  primaryDark: "#0A6B61",
  navy: "#12355B",
  background: "#F5F8FB",
  surface: "#FFFFFF",
  border: "#C9D3DC",
  textPrimary: "#1F2933",
  textSecondary: "#5B6770",
  success: "#2E7D32",
  warning: "#F2A900",
  danger: "#B3261E",
  info: "#1E6FD9",
  grey: "#8B95A0",
  greyLight: "#E8EEF3",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700" as const,
    lineHeight: 24,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
};

export type Theme = typeof theme;
