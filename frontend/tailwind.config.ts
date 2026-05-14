import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#fffdf8",
        sand: "#fff6ea",
        mist: "#eef6f7",
        ink: "#102033",
        teal: {
          50: "#ecfeff",
          100: "#cffafe",
          500: "#0f766e",
          600: "#0d6660",
        },
        coral: {
          100: "#ffe8de",
          300: "#f7b58f",
          500: "#e88a5a",
        },
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI", "Tahoma", "sans-serif"],
        display: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Book Antiqua",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        soft: "0 24px 70px rgba(16, 32, 51, 0.12)",
        glow: "0 20px 45px rgba(15, 118, 110, 0.18)",
      },
      keyframes: {
        floatIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px) scale(0.98)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        slowPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
      },
      animation: {
        "float-in": "floatIn 0.7s ease-out both",
        "slow-pulse": "slowPulse 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
