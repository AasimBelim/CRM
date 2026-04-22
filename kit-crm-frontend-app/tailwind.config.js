/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ very important
  ],
    safelist: [
    "cursor-grab",
    "cursor-grabbing",
    "cursor-move",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};