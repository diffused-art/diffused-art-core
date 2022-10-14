const colorTheme = {
  'primary': '#1B1B1B',
  'secondary': '#FFC700',
  'third': '#3E3E3E',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.js",
  ],
  theme: {
    extend: {
      backgroundColor: colorTheme,
      textColor: colorTheme,
      colors: colorTheme,
      borderColor: colorTheme,
    },
    fontFamily: {
      'sans': ['TestFont', 'Helvetica', 'Arial', 'sans-serif'],
      'sansLight': ['TestFontLight', 'Helvetica', 'Arial', 'sans-serif'],
      'bold': ['TestFontBold', 'Helvetica', 'Arial', 'sans-serif'],
    },
  },
  plugins: [
    require("flowbite/plugin")
  ],
}