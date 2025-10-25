/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  // Use 'class' strategy to avoid conflicts with Ionic
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors - Scientific & Trustworthy
        primary: {
          DEFAULT: '#5B8DEE',
          50: '#EEF4FF',
          100: '#D9E7FE',
          200: '#B9D6FD',
          300: '#8BBFFB',
          400: '#5B8DEE',
          500: '#4F7CD1',
          600: '#3E5FA8',
          700: '#2F4880',
          800: '#1F3055',
          900: '#0F182B',
        },
        secondary: {
          DEFAULT: '#00D4AA',
          50: '#E6FBF7',
          100: '#B3F3E6',
          200: '#80EBD5',
          300: '#4DE3C4',
          400: '#1AD8B3',
          500: '#00D4AA',
          600: '#00BB96',
          700: '#009976',
          800: '#007759',
          900: '#00553D',
        },
        tertiary: {
          DEFAULT: '#A78BFA',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#927ADC',
          600: '#7C5DC7',
          700: '#6644A8',
          800: '#502E85',
          900: '#3A1A5E',
        },
        // Functional Colors
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Neutral Colors
        neutral: {
          50: '#FAFBFC',
          100: '#F8FAFC',
          200: '#F1F5F9',
          300: '#E2E8F0',
          400: '#CBD5E1',
          500: '#94A3B8',
          600: '#64748B',
          700: '#475569',
          800: '#334155',
          900: '#1E293B',
          950: '#0F172A',
        },
        // Surface & Background
        surface: {
          DEFAULT: '#FFFFFF',
          variant: '#F8FAFC',
          hover: '#F1F5F9',
        },
        // Accent Colors
        accent: {
          blue: '#60A5FA',
          teal: '#2DD4BF',
          purple: '#C084FC',
          pink: '#F472B6',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1' }],            // 48px
      },
      spacing: {
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'base': '1rem',     // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
        '3xl': '4rem',      // 64px
        '4xl': '6rem',      // 96px
        '5xl': '8rem',      // 128px
      },
      borderRadius: {
        'xs': '0.25rem',    // 4px
        'sm': '0.375rem',   // 6px
        'base': '0.5rem',   // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
        '2xl': '1.25rem',   // 20px
        '3xl': '1.5rem',    // 24px
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'medium': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'strong': '0 16px 48px rgba(0, 0, 0, 0.16)',
        'xl': '0 20px 64px rgba(0, 0, 0, 0.20)',
        // Colored shadows
        'primary': '0 8px 24px rgba(91, 141, 238, 0.25)',
        'secondary': '0 8px 24px rgba(0, 212, 170, 0.25)',
        'success': '0 8px 24px rgba(34, 197, 94, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'light': '8px',
        'medium': '16px',
        'heavy': '24px',
        'xl': '32px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'normal': '300ms',
        'slow': '350ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      // Custom screens for comprehensive responsive design
      screens: {
        'xs': '320px',    // Small phones
        'sm': '480px',    // Standard phones
        'md': '768px',    // Tablets portrait
        'lg': '1024px',   // Tablets landscape / Small desktop
        'xl': '1366px',   // Standard desktop
        '2xl': '1536px',  // Large desktop
        '3xl': '1920px',  // Full HD
        '4xl': '2560px',  // 4K
      },
    },
  },
  // Important: Add corePlugins configuration to avoid conflicts with Ionic
  corePlugins: {
    preflight: false, // Disable Tailwind's base reset to avoid conflicts with Ionic
  },
  plugins: [],
}

