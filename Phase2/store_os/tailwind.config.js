/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Replace 'orbitron' with the new 'cinzel' font family
      fontFamily: {
        'cinzel': ['"Cinzel Decorative"', 'serif'],
      }
    },
  },
  plugins: [],
}
