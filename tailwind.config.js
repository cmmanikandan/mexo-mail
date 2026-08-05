/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mexo: {
          50: '#eaf3ff',
          100: '#eef5ff',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36abfa',
          500: '#0878e8',
          600: '#0878E8', // Official Primary MEXO Blue
          700: '#0668CC', // Primary Hover
          800: '#054b8d',
          900: '#0a3f74',
          950: '#07284d',
        },
        app: {
          bg: '#F6F8FC',
          surface: '#FFFFFF',
          secondarySurface: '#F8FAFD',
          softBrandSurface: '#EEF5FF',
          primary: '#0878E8',
          primaryHover: '#0668CC',
          primarySoft: '#EAF3FF',
          heading: '#101828',
          body: '#475467',
          muted: '#8492A6',
          border: '#E1E7EF',
          danger: '#D92D20',
          success: '#079455',
        },
        auth: {
          pageBg: '#F7F8FA',
          surface: '#FFFFFF',
          leftTint: '#F7F9FF',
          border: '#E7EAF0',
          separator: '#EEF0F4',
          inputBorder: '#C9D2DF',
          inputHover: '#9EADBF',
          textPrimary: '#111827',
          textSecondary: '#53627A',
          textMuted: '#7D899C',
          // Dark Mode equivalents
          darkPageBg: '#0D1117',
          darkSurface: '#141A22',
          darkLeftTint: '#111827',
          darkInputBorder: '#2B3543',
          darkInputBg: '#171E28',
          darkTextPrimary: '#F5F7FA',
          darkTextSecondary: '#AAB4C3',
        },
        accent: {
          green: '#10b981',
          greenHover: '#059669',
          greenLight: '#ecfdf5',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        surface: {
          light: '#ffffff',
          lightMuted: '#f8fafc',
          lightBorder: '#e2e8f0',
          dark: '#0f172a',
          darkMuted: '#1e293b',
          darkBorder: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'mexo-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'mexo-md': '0 4px 20px 0 rgba(0, 0, 0, 0.03)',
        'mexo-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'mexo-popover': '0 12px 28px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '13': '3.25rem',
        '14': '3.5rem',
        '18': '4.5rem',
        '68': '17rem',
      }
    },
  },
  plugins: [],
}
