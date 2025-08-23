module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Shadcn colors (use CSS variables)
        primary: { 
          DEFAULT: 'hsl(var(--primary))', 
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: { 
          DEFAULT: 'hsl(var(--secondary))', 
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        background: { 
          DEFAULT: 'hsl(var(--background))',
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
          muted: '#f5f5f5',
        },
        foreground: 'hsl(var(--foreground))',
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
          inverse: '#ffffff',
          muted: '#9a9b9bff',
        },
        border: { 
          DEFAULT: 'hsl(var(--border))',
          primary: '#e5e7eb',
          secondary: '#d1d5db',
          focus: '#3b82f6',
          error: '#ef4444',
          muted: '#f5f5f5',
        },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      spacing: { '18': '4.5rem', '88': '22rem' },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      textColor: {
        'p-link': '#2563eb', // Blue-600
      },
      typography: {
        DEFAULT: {
          css: {
            '.p-link': {
              color: '#2563eb', // Blue-600
              fontWeight: '600', // Semi-bold
              textDecoration: 'none',
              '&:hover': {
                color: '#1e40af', // Blue-900
                textDecoration: 'underline',
              },
            },
          },
        },
      },
      // Component utilities
      components: {
        'btn': 'inline-flex items-center justify-center rounded-md border-2 px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'btn-primary': 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white border-primary-500 focus:ring-primary-500',
        'btn-secondary': 'bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 text-text-primary border-border-primary focus:ring-secondary-500',
        'btn-error': 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white border-error-500 focus:ring-error-500',
        'btn-disabled': 'bg-neutral-300 text-neutral-500 cursor-not-allowed border-neutral-300',
        
        'input-base': 'w-full bg-white border rounded-md focus:ring-2 text-text-primary placeholder-text-tertiary px-3 py-2 transition-colors duration-200',
        'input-default': 'border-border-primary focus:border-primary-500 focus:ring-primary-500',
        'input-error': 'border-error-500 focus:border-error-500 focus:ring-error-500',
        'input-success': 'border-success-500 focus:border-success-500 focus:ring-success-500',
        
        'card-base': 'bg-white border border-border-primary rounded-lg shadow-sm',
        'card-hover': 'hover:shadow-md transition-shadow duration-200',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addComponents, theme }) {
      addComponents({
        '.btn': {
          '@apply inline-flex items-center justify-center rounded-md border-2 px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2': {},
        },
        '.btn-primary': {
          '@apply bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white border-primary-500 focus:ring-primary-500': {},
        },
        '.btn-secondary': {
          '@apply bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 text-text-primary border-border-primary focus:ring-secondary-500': {},
        },
        '.btn-error': {
          '@apply bg-error-500 hover:bg-error-600 active:bg-error-700 text-white border-error-500 focus:ring-error-500': {},
        },
        '.btn-disabled': {
          '@apply bg-neutral-300 text-neutral-500 cursor-not-allowed border-neutral-300': {},
        },
        '.input-base': {
          '@apply w-full bg-white border rounded-md focus:ring-2 text-text-primary placeholder-text-tertiary px-3 py-2 transition-colors duration-200': {},
        },
        '.input-default': {
          '@apply border-border-primary focus:border-primary-500 focus:ring-primary-500': {},
        },
        '.input-error': {
          '@apply border-error-500 focus:border-error-500 focus:ring-error-500': {},
        },
        '.input-success': {
          '@apply border-success-500 focus:border-success-500 focus:ring-success-500': {},
        },
        '.card-base': {
          '@apply bg-white border border-border-primary rounded-lg shadow-sm': {},
        },
        '.card-hover': {
          '@apply hover:shadow-md transition-shadow duration-200': {},
        },
      });
    },
  ],
};