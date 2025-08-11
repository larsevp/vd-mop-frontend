/**
 * Centralized color theme configuration
 * Following best practices for maintainable design systems
 */

export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary colors (complementary to primary)
  secondary: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',  // Main secondary
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },

  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Main success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Error/Danger colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Info colors
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main info
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral/Gray colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',  // Main neutral
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background colors
  background: {
    primary: '#ffffff',      // Main background
    secondary: '#f8fafc',    // Secondary background
    tertiary: '#f1f5f9',     // Tertiary background
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  },

  // Text colors
  text: {
    primary: '#1f2937',      // Main text
    secondary: '#6b7280',    // Secondary text
    tertiary: '#9ca3af',     // Tertiary text
    inverse: '#ffffff',      // Text on dark backgrounds
    muted: '#d1d5db',        // Muted text
  },

  // Border colors
  border: {
    primary: '#e5e7eb',      // Main borders
    secondary: '#d1d5db',    // Secondary borders
    focus: '#3b82f6',        // Focus borders
    error: '#ef4444',        // Error borders
  },
};

// Semantic color mappings for easy component usage
export const semantic = {
  // Button variants
  button: {
    primary: {
      bg: colors.primary[500],
      bgHover: colors.primary[600],
      bgActive: colors.primary[700],
      text: colors.text.inverse,
      border: colors.primary[500],
    },
    secondary: {
      bg: colors.secondary[100],
      bgHover: colors.secondary[200],
      bgActive: colors.secondary[300],
      text: colors.text.primary,
      border: colors.border.primary,
    },
    success: {
      bg: colors.success[500],
      bgHover: colors.success[600],
      bgActive: colors.success[700],
      text: colors.text.inverse,
      border: colors.success[500],
    },
    error: {
      bg: colors.error[500],
      bgHover: colors.error[600],
      bgActive: colors.error[700],
      text: colors.text.inverse,
      border: colors.error[500],
    },
  },

  // Form elements
  form: {
    input: {
      bg: colors.background.primary,
      bgFocus: colors.background.primary,
      border: colors.border.primary,
      borderFocus: colors.border.focus,
      borderError: colors.border.error,
      text: colors.text.primary,
      placeholder: colors.text.tertiary,
    },
    select: {
      bg: colors.background.primary,
      bgHover: colors.background.secondary,
      border: colors.border.primary,
      borderFocus: colors.border.focus,
      text: colors.text.primary,
    },
  },

  // Status indicators
  status: {
    success: colors.success[500],
    error: colors.error[500],
    warning: colors.warning[500],
    info: colors.info[500],
  },

  // Navigation
  nav: {
    bg: colors.background.primary,
    text: colors.text.primary,
    textActive: colors.primary[600],
    bgHover: colors.background.secondary,
  },
};

// Export everything for easy importing
export default {
  colors,
  semantic,
};
