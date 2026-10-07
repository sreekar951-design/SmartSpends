/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F17",
        darkCard: "rgba(22, 27, 38, 0.75)",
        neonPurple: "#8b5cf6",
        neonCyan: "#06b6d4",
        neonPink: "#ec4899"
      }
    },
  },
  plugins: [],
}