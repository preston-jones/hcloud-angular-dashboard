/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff1f5',
          100: '#ffe4ea',
          200: '#fec8d4',
          300: '#fd9fb5',
          400: '#fb6a8e',
          500: '#f43f5e',
          600: '#E40046',   // Hetzner Rot ❤️
          700: '#be003a',
          800: '#9a0031',
          900: '#7a0229',
          DEFAULT: '#E40046',
        },
        accent: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563EB',  // Hetzner Blau
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#2563EB',
        },
        success: {
          50:  '#ecfdf3',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#22c55e',
          600: '#16A34A',  // Green Coding Grün 💚
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          DEFAULT: '#16A34A',
        },
        sidebar: '#1E293B',
        bg: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -15px rgba(2, 6, 23, 0.15)',
      },
    },
  },
  plugins: [],
};
