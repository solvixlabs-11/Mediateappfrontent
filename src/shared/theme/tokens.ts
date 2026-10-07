/**
 * Design system tokens from design.md
 */

export const colors = {
  primary: "#1B64DA",
  primaryDark: "#154EA6",
  navy: "#16285A",
  brandBlue: "#2C3E93",
  brandRed: "#E11D48",
  halkaBlue: "#EBF3FC",
  halkaBlueBorder: "#CFE2F8",
  background: "#F4F8FC",
  surface: "#FFFFFF",
  border: "#D8E4F2",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#1E6FD9",
  grey: "#94A3B8",
  greyLight: "#F1F5F9",
  lightPrimary: "#EBF3FC",
  secondary: "#16A34A",
  error: "#DC2626",
  text: "#1E293B",
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
  xl: 24,
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
  button: {
    fontSize: 14,
    fontWeight: "600" as const,
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
