/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <— Dark Mode per .dark-Klasse auf <html>
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#E40046',
        accent: '#2563EB',
        success: '#16A34A',
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
