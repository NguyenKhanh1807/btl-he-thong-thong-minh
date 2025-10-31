/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      fontFamily: {
        sans: [
          "Inter", "ui-sans-serif", "system-ui", "-apple-system",
          "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans",
          "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"
        ],
      },
      colors: {
        brand: {
          50:  "#eef6ff",
          100: "#d9ecff",
          200: "#bfe0ff",
          300: "#91c6ff",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        }
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(2,6,23,0.08)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      }
    },
  },
  plugins: [],
};
