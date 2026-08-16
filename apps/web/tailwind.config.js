/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          active: "#1d4ed8",
        },
        accent: {
          blue: "#2563eb",
          green: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
