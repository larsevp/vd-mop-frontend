import { useMemo } from 'react';
import theme from '../config/theme';

/**
 * Custom hook for accessing theme colors and utilities
 * Provides a clean API for components to use theme values
 */
export const useTheme = () => {
  return useMemo(() => ({
    // Direct access to color palettes
    colors: theme.colors,
    semantic: theme.semantic,
    
    // Utility functions for common patterns
    getButtonColors: (variant = 'primary') => {
      return theme.semantic.button[variant] || theme.semantic.button.primary;
    },
    
    getStatusColor: (status) => {
      return theme.semantic.status[status] || theme.colors.neutral[500];
    },
    
    getFormColors: () => {
      return theme.semantic.form;
    },
    
    // CSS custom properties for inline styles
    getCSSVars: () => ({
      '--color-primary': theme.colors.primary[500],
      '--color-primary-hover': theme.colors.primary[600],
      '--color-secondary': theme.colors.secondary[500],
      '--color-success': theme.colors.success[500],
      '--color-error': theme.colors.error[500],
      '--color-warning': theme.colors.warning[500],
      '--color-info': theme.colors.info[500],
      '--color-text-primary': theme.colors.text.primary,
      '--color-text-secondary': theme.colors.text.secondary,
      '--color-background-primary': theme.colors.background.primary,
      '--color-background-secondary': theme.colors.background.secondary,
      '--color-border-primary': theme.colors.border.primary,
    }),
  }), []);
};

/**
 * Utility function to generate Tailwind classes based on theme
 */
export const getThemeClasses = {
  // Button classes
  button: {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white border-primary-500',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 text-text-primary border-border-primary',
    success: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white border-success-500',
    error: 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white border-error-500',
    warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-white border-warning-500',
    info: 'bg-info-500 hover:bg-info-600 active:bg-info-700 text-white border-info-500',
  },
  
  // Form input classes
  input: {
    base: 'bg-white border-border-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 text-text-primary placeholder-text-tertiary',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
  },
  
  // Card classes
  card: {
    base: 'bg-white border-border-primary shadow-card hover:shadow-card-hover',
    elevated: 'bg-white border-border-primary shadow-dropdown',
  },
  
  // Text classes
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary', 
    tertiary: 'text-text-tertiary',
    inverse: 'text-white',
    muted: 'text-text-muted',
  },
  
  // Background classes
  background: {
    primary: 'bg-background-primary',
    secondary: 'bg-background-secondary',
    tertiary: 'bg-background-tertiary',
  },
};

export default useTheme;
