/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space navy surface scale (Discord-inspired)
        stage: '#0d0e23',
        bg: '#11132c',
        surface: '#1a1c3f',
        raised: '#23265a',
        overlay: '#2c2f6b',
        // Ink scale (cool white → muted)
        ink: '#f4f5ff',
        'ink-secondary': '#b9bdde',
        'ink-muted': '#8187b8',
        // Blurple accent — primary actions and live state only
        accent: {
          DEFAULT: '#5865f2',
          bright: '#7983f5',
          deep: '#4752c4',
          ink: '#ffffff', // text on accent surfaces
        },
        danger: {
          DEFAULT: '#e5484d',
          bright: '#f06a6f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-in-out both',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'popIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 5s ease-in-out infinite',
        wave: 'wave 1s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
        'spin-slow': 'spin 3.5s linear infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'aurora-a': 'auroraA 22s ease-in-out infinite alternate',
        'aurora-b': 'auroraB 28s ease-in-out infinite alternate',
        'dot-bounce': 'dotBounce 1.2s ease-in-out infinite',
        bob: 'bob 7s ease-in-out infinite',
        twinkle: 'twinkle 3.5s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        breathe: 'breathe 4.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        popIn: { '0%': { opacity: '0', transform: 'scale(0.6)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        wave: { '0%, 100%': { transform: 'scaleY(0.35)' }, '50%': { transform: 'scaleY(1)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 24px rgba(88, 101, 242, 0.2)' },
          '50%': { boxShadow: '0 0 56px rgba(88, 101, 242, 0.45)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        auroraA: {
          '0%': { transform: 'translate(-12%, -8%) scale(1)' },
          '50%': { transform: 'translate(10%, 6%) scale(1.15)' },
          '100%': { transform: 'translate(-6%, 10%) scale(0.95)' },
        },
        auroraB: {
          '0%': { transform: 'translate(10%, 8%) scale(1.1)' },
          '50%': { transform: 'translate(-8%, -6%) scale(0.9)' },
          '100%': { transform: 'translate(6%, -10%) scale(1.2)' },
        },
        dotBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-12px) rotate(2deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
};
