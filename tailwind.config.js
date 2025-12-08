/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",   // ⭐ REQUIRED for your dark mode toggle
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}" // optional but recommended
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
