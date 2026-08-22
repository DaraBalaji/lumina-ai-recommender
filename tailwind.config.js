/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0b63ff',
          container: '#e6f0ff',
          fixed: '#eaf4ff',
          'fixed-dim': '#c7e0ff',
        },
        secondary: {
          DEFAULT: '#006a61',
          container: '#86f2e4',
          'on-container': '#003732',
          fixed: '#89f5e7',
          'fixed-dim': '#6bd8cb',
        },
        tertiary: {
          DEFAULT: '#02003c',
          container: '#09007e',
        },
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          container: '#e5eeff',
          'container-low': '#eff4ff',
          'container-lowest': '#ffffff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
          variant: '#d3e4fe',
        },
        'on-surface': '#0b1c30',
        'on-surface-variant': '#47464f',
        outline: '#787680',
        'outline-variant': '#c8c5d0',
        background: '#f8f9ff',
        'on-background': '#0b1c30',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'ai-glow': '0 0 40px rgba(0, 106, 97, 0.25)',
        'glass-glow': '0 10px 30px -10px rgba(7, 2, 53, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 5s infinite',
      },
    },
  },
  plugins: [],
};
