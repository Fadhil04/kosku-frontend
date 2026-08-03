/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Trust Blue
        primary: {
          DEFAULT: '#00236f',
          container: '#1e3a8a',
          fixed: '#dce1ff',
          'fixed-dim': '#b6c4ff',
          'on': '#ffffff',
          'on-container': '#90a8ff',
        },
        // Secondary — Growth Green
        secondary: {
          DEFAULT: '#006c49',
          container: '#6cf8bb',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
          'on': '#ffffff',
          'on-container': '#00714d',
        },
        // Tertiary — Warning Amber
        tertiary: {
          DEFAULT: '#3e2400',
          container: '#5c3800',
          fixed: '#ffddb8',
          'fixed-dim': '#ffb95f',
          'on': '#ffffff',
          'on-container': '#ef9900',
        },
        // Surface scale
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          container: {
            DEFAULT: '#e5eeff',
            lowest: '#ffffff',
            low: '#eff4ff',
            high: '#dce9ff',
            highest: '#d3e4fe',
          },
          tint: '#4059aa',
          variant: '#d3e4fe',
        },
        // On-surface
        'on-surface': {
          DEFAULT: '#0b1c30',
          variant: '#444651',
        },
        // Inverse
        inverse: {
          surface: '#213145',
          'on-surface': '#eaf1ff',
          primary: '#b6c4ff',
        },
        // Outline
        outline: {
          DEFAULT: '#757682',
          variant: '#c5c5d3',
        },
        // Background
        background: '#f8f9ff',
        'on-background': '#0b1c30',
        // Error
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on': '#ffffff',
          'on-container': '#93000a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-md': ['13px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0px 1px 3px rgba(30, 58, 138, 0.06), 0px 1px 2px rgba(30, 58, 138, 0.04)',
        'card-hover': '0px 10px 25px -5px rgba(30, 58, 138, 0.08), 0px 4px 6px -2px rgba(30, 58, 138, 0.04)',
        modal: '0px 20px 60px rgba(30, 58, 138, 0.15)',
        nav: '0px 1px 0px #c5c5d3',
      },
      spacing: {
        '4.5': '18px',
        '18': '72px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
}
