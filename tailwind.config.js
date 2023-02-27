/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"
  ],
  theme: {
    container: {
      screens: {
        sm: '600px',
        md: '728px',
        lg: '984px',
        xl: '1024px',
        '2xl': '1024px',
      },
    },
    extend: {
      colors: {
        primary: '#1a1b1b',
        'primary-100': '#1B1B1B',
        secondary: '#d5d5d5',
        "white-half-transparent": 'rgba(255, 255, 255, 0.5)',
        'secondary-50': '#242424',
        'secondary-90': '#3A3A3A',
        'secondary-100': '#3E3E3E',
        'secondary-110': '#4d4d4d',
        "input-bg": 'rgba(241, 241, 241, 0.1)',
        "gray-half-transparent": 'rgba(62, 62, 62, 0.7)',
        'main-yellow': '#FFC700',
        'yellow-opaque': 'rgba(255, 199, 0, 0.3)'
      },
    },
  },
  plugins: [require("@tailwindcss/forms")({
    strategy: 'class',
  })],
};
