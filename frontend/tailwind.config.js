/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#f8f8f7',
        panel: '#ffffff',
        list: '#f3f3f1',
        accent: '#1d9e75',
        urgent: { text: '#a32d2d', bg: '#fcebeb' },
        mid: { text: '#854f0b', bg: '#faeeda' },
        low: { text: '#0f6e56', bg: '#e1f5ee' },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
