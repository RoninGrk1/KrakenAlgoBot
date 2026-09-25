import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: { 950: "#07080a", 900: "#0c0e12", 800: "#12151b", 700: "#1a1f28" }, mist: "#9aa3b2" }
    }
  },
  plugins: []
} satisfies Config;
