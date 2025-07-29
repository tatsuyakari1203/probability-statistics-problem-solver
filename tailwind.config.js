const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./index.html",
    "./{components,services,src}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.indigo,
        gray: colors.neutral,
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}