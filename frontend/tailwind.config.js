/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rooms: "#2563eb",
        restaurant: "#d97706",
        liquor: "#7c3aed",
        reporting: "#059669",
      },
    },
  },
  plugins: [],
};
