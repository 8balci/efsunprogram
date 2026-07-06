/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        marka: {
          DEFAULT: '#E4572E', // RAL 2008 Bright Red Orange (yaklaşık)
          dark: '#B8401D',
          light: '#F3835F',
        },
        antrasit: {
          DEFAULT: '#282B30',
          soft: '#3A3E45',
        },
        zemin: '#F0F1F4',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(40, 43, 48, 0.10)',
        'glass-lg': '0 20px 60px -10px rgba(40, 43, 48, 0.18)',
        'marka-glow': '0 0 0 1px rgba(228, 87, 46, 0.25), 0 8px 24px -4px rgba(228, 87, 46, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(228,87,46,0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(228,87,46,0)' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2.4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
