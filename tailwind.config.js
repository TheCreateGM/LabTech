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
        // Match existing LabTech color scheme
        primary: {
          DEFAULT: '#667eea',
          light: '#7691ec',
          dark: '#5a6fd8',
        },
        secondary: {
          DEFAULT: '#764ba2',
          light: '#845fab',
          dark: '#68428f',
        },
        tertiary: {
          DEFAULT: '#f093fb',
          light: '#f29efb',
          dark: '#d482dd',
        },
        accent: '#4facfe',
        surface: '#ffffff',
        'surface-variant': '#f1f5f9',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'base': '1rem',     // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
      },
      borderRadius: {
        'xs': '0.125rem',   // 2px
        'sm': '0.25rem',    // 4px
        'base': '0.5rem',   // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
        '2xl': '1.5rem',    // 24px
      },
      boxShadow: {
        'soft': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'medium': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'strong': '0 16px 64px rgba(0, 0, 0, 0.16)',
      },
      backdropBlur: {
        'light': '8px',
        'medium': '16px',
        'heavy': '24px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '300ms',
        'slow': '500ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  // Important: Add corePlugins configuration to avoid conflicts with Ionic
  corePlugins: {
    preflight: false, // Disable Tailwind's base reset to avoid conflicts with Ionic
  },
  plugins: [],
}

