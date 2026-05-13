import {StyleSheet} from 'react-native';

// ─── Color Tokens ─────────────────────────────────────────────

export const adminColors = {
  // Backgrounds
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceElevated: '#242836',
  surfaceHover: '#2C3040',

  // Primary
  primary: '#FFD54F',
  primaryLight: '#FFECB3',
  primaryDark: '#FFC107',

  // Secondary
  secondary: '#1976D2',
  secondaryLight: '#42A5F5',
  secondaryDark: '#1565C0',

  // Accent
  accent: '#00D9FF',
  accentGreen: '#10B981',
  accentOrange: '#F59E0B',
  accentRed: '#EF4444',
  accentPink: '#EC4899',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Borders
  border: '#2D3348',
  borderLight: '#3B4260',
  borderFocus: '#6C63FF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
} as const;

export const studentColors = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F1F5F9',

  // Primary (Yellow)
  primary: '#FFD54F',
  primaryLight: '#FFECB3',
  primaryDark: '#FFC107',

  // Secondary (Blue)
  secondary: '#1976D2',
  secondaryLight: '#42A5F5',
  secondaryDark: '#1565C0',

  // Accent
  accent: '#06B6D4',
  accentGreen: '#10B981',
  accentOrange: '#F59E0B',
  accentRed: '#EF4444',
  accentPink: '#EC4899',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#F8FAFC',
  textOnPrimary: '#3E2723',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#1976D2',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
} as const;

// ─── Typography ───────────────────────────────────────────────

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    heading: 28,
    hero: 34,
  },
  lineHeight: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    heading: 36,
    hero: 42,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────

export const shadows = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});

// ─── Theme Exports ────────────────────────────────────────────

export type ThemeColors = typeof adminColors;

export const adminTheme = {
  colors: adminColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  isDark: true,
} as const;

export const studentTheme = {
  colors: studentColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  isDark: false,
} as const;

export type AppTheme = typeof adminTheme | typeof studentTheme;
