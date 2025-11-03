/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#D71D36',   // Hetzner Rot (offiziell)
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          DEFAULT: '#D71D36',
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
        // Hetzner spezifische Farben
        hetzner: {
          red: '#D71D36',
          blue: '#2563EB',
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        },
        // Surfaces & Background
        surface: {
          page: '#F5F6F7',          // Topbar/Page-Hintergrund ~ #f0f2f3–#f5f6f7
          sidebar: '#F3EEEF',       // Sidebar-Hintergrund
          card: '#FFFFFF',          // Karten/Paneele
          muted: '#F4F4F5'          // Hover/ausgewählt hell
        },
        border: {
          DEFAULT: '#E5E7EB',       // feine Borders
          soft: '#ECEDEE'
        },
        text: {
          DEFAULT: '#111827',       // Haupttext
          soft: '#6B7280'           // Sekundär
        },
        // Controls
        input: {
          bg: '#F3F4F6',            // Inputs / Search
          ring: '#E5E7EB'
        },
        sidebar: '#1E293B',
        bg: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(17, 24, 39, 0.04)', // sehr subtil wie Hetzner
        hetzner: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
      borderRadius: {
        hetzner: '8px',
      }
    },
  },
  plugins: [],
};
