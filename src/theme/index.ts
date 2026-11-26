/**
 * Mediate Mobile App Design System Theme
 * Strict Design System for UI Redesign
 */

export const colors = {
  // Brand & Navies
  navy: "#1B2470",
  navyGradient: ["#27339A", "#1B2470"] as const,
  brandBlue: "#2F3DB5",
  brandBlueLight: "#3B4CCA",
  primary: "#1B2470",
  primaryDark: "#151B54",

  // Accent Red (Punch in, alerts, small accents)
  accentRed: "#E5333F",
  accentRedPastel: "#FDE8E9",
  danger: "#E5333F",
  error: "#E5333F",

  // Surfaces & Backgrounds
  background: "#F4F6FC",
  surface: "#FFFFFF",
  surfaceSecondary: "#F8FAFE",
  inputBackground: "#F3F5FC",
  border: "#E1E6F5",
  borderLight: "#EDF1FA",

  // Typography Colors
  textInk: "#0F1538",
  textMuted: "#5B6490",
  textFaint: "#8890B5",
  textLight: "#FFFFFF",
  textSecondary: "#5B6490",
  textPrimary: "#0F1538",

  // Tile & Status Colors
  teal: "#0E8A7D",
  tealPastel: "#DDF3EF",
  orange: "#C26A10",
  orangePastel: "#FFEFD9",
  purple: "#6A3FC4",
  purplePastel: "#ECE5F8",
  bluePastel: "#E4E9FF",
  blueTile: "#223594",
  successGreen: "#1F9D6B",
  successGreenPastel: "#E2F7ED",
  success: "#1F9D6B",
  warning: "#D97706",
  warningPastel: "#FEF3C7",

  // Overlays
  backdrop: "rgba(15, 21, 56, 0.45)",
  overlay: "rgba(27, 36, 112, 0.15)",
  translucentWhite: "rgba(255, 255, 255, 0.15)",
  translucentWhiteHigh: "rgba(255, 255, 255, 0.35)",
  emailSubtitle: "#C9D0F5",
  tintBlue: "#F0F3FF",
  dangerPastel: "#FEE2E2",

  // Legacy mappings for backward compatibility
  brandRed: "#E5333F",
  halkaBlue: "#E4E9FF",
  halkaBlueBorder: "#CFE2F8",
  faint: "#8890B5",
  grey: "#8890B5",
  greyLight: "#F3F5FC",
  lightPrimary: "#E4E9FF",
  secondary: "#1F9D6B",
  info: "#2F3DB5",
  text: "#0F1538",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  card: 24,
  cardLg: 28,
  sheet: 32,
  full: 9999,
} as const;

export const shadows = {
  soft: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sheet: {
    shadowColor: "#0F1538",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  // Convenience aliases
  sm: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  modal: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: "#1B2470",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const fontFamilies = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
} as const;

export const typography = {
  titleLarge: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800" as const,
    color: colors.textInk,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
    color: colors.textInk,
  },
  sectionTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800" as const,
    color: colors.textInk,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    color: colors.textInk,
  },
  subheading: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600" as const,
    color: colors.textInk,
  },
  body: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  bodyMedium: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
    color: colors.textInk,
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    color: colors.textFaint,
  },
  button: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700" as const,
    color: colors.textLight,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  fontFamilies,
  typography,
};

export type Theme = typeof theme;
