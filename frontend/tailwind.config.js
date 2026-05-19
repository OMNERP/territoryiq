/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e1a',
          2: '#0f1420',
          3: '#141928',
          4: '#1a2035',
        },
        card: '#161b2e',
        border: 'rgba(255,255,255,0.06)',
        'border-2': 'rgba(255,255,255,0.1)',
        text: {
          DEFAULT: '#e8eaf0',
          2: '#8b93a8',
          3: '#5a6380',
        },
        accent: {
          DEFAULT: '#4f8ef7',
          2: '#7c6ff7',
        },
        success: '#34c97e',
        warning: '#f5a623',
        danger: '#f05b5b',
        info: '#26d4d4',
        pink: '#e85d9e',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        btn: '10px',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'slide-in': {
          from: { transform: 'translateX(20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s infinite',
        'slide-in': 'slide-in 0.3s ease',
        'fade-in': 'fade-in 0.25s ease',
      },
    },
  },
  plugins: [],
};
