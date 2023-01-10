/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1b1b',
        'primary-100': '#1B1B1B',
        secondary: '#d5d5d5',
        'secondary-50': '#242424',
        'secondary-90': '#3A3A3A',
        'secondary-100': '#3E3E3E',
        "input-bg": 'rgba(241, 241, 241, 0.1)',
        'main-yellow': '#FFC700'
      },
    },
  },
  plugins: [],
};
