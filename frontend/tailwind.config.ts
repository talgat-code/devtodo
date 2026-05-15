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
        "glow-sm": "0 8px 24px rgba(15, 118, 110, 0.22)",
        "lift": "0 20px 60px rgba(16, 32, 51, 0.18)",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slowPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.93) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-18px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.72)" },
          "65%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        overlayIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        statusBeacon: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.6)", opacity: "0" },
        },
        countPop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "float-in": "floatIn 0.7s ease-out both",
        "slow-pulse": "slowPulse 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-left": "slideInLeft 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "pop-in": "popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "overlay-in": "overlayIn 0.22s ease-out both",
        "status-beacon": "statusBeacon 1.8s ease-in-out infinite",
        "count-pop": "countPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "gradient-shift": "gradientShift 6s ease infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
