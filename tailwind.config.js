/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#04060d',
          deep: '#070b18',
          panel: '#0b1224',
          line: 'rgba(148,163,184,0.16)',
          cyan: '#22d3ee',
          ice: '#67e8f9',
          violet: '#8b5cf6',
          blue: '#3b82f6',
          amber: '#f59e0b',
          rose: '#fb7185',
          emerald: '#34d399',
          text: '#e2e8f0',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(34,211,238,0.25), 0 0 64px rgba(34,211,238,0.12)',
        'glow-violet': '0 0 24px rgba(139,92,246,0.25), 0 0 64px rgba(139,92,246,0.12)',
        'glow-soft': '0 8px 40px rgba(2,6,23,0.7)',
        'inner-glass': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%,100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        scanline: 'scanline 6s linear infinite',
        'spin-slow': 'spin-slow 24s linear infinite',
        blink: 'blink 1.4s step-end infinite',
      },
    },
  },
  plugins: [],
};
