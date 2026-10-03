/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090e10',
        surface: '#11181b',
        elevated: '#192226',
        night: '#090e10',
        panel: '#11181b',
        line: '#29363a',
        accent: '#c2f970',
        slate: {
          50: '#f5f7f6',
          100: '#e6eae8',
          200: '#c9d1ce',
          300: '#a5b0ac',
          400: '#818d89',
          500: '#65716d',
          600: '#4a5652',
          700: '#303b38',
          800: '#20292a',
          900: '#141b1d',
          950: '#0b1012',
        },
      },
      borderRadius: {
        touch: '0.875rem',
      },
      minHeight: {
        touch: '2.75rem',
      },
    },
  },
  plugins: [],
};