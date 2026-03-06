import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        surface: '#111111',
        border: '#1f1f1f',
        recovery: {
          green: '#4ade80',
          yellow: '#facc15',
          red: '#f87171',
        },
        sleep: '#818cf8',
        hrv: '#c084fc',
        battery: '#38bdf8',
        strain: '#fb923c',
        stress: '#f59e0b',
        muted: '#404040',
        secondary: '#737373',
        primary: '#f5f5f5',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'gauge-fill': 'gaugeFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gaugeFill: {
          '0%': { strokeDashoffset: 'var(--full-dash)' },
          '100%': { strokeDashoffset: 'var(--target-dash)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
