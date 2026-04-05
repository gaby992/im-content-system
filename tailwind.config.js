/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B3A6B',
          light: '#2a5298',
          dark: '#122647',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#e0c068',
          dark: '#a8873a',
        },
      },
    },
  },
  plugins: [],
}
