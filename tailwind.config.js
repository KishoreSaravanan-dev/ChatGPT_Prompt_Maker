/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151312",
        paper: "#f8f4e8",
        clay: "#d86f45",
        pine: "#1f4d45",
        gold: "#d2a83f",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        body: ["Segoe UI", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 35px rgba(21, 19, 18, 0.14)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 420ms ease-out forwards",
      },
    },
  },
  plugins: [],
};
