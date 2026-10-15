import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vena: {
          50: "#EDF7F1",
          100: "#D2EDDC",
          200: "#A6DBBA",
          300: "#79C998",
          400: "#4DB775",
          500: "#2A9D54",
          600: "#1E7A40",
          700: "#155730",
          800: "#0F3D20",
          900: "#0A2815",
        },
        charcoal: {
          DEFAULT: "#1A2B22",
          light: "#3A4A42",
          muted: "#6B8275",
        },
        background: "#F7F9F4",
        surface: "#FFFFFF",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 61, 32, 0.04)",
        card: "0 4px 12px -2px rgba(15, 61, 32, 0.06)",
        hover: "0 8px 24px -4px rgba(15, 61, 32, 0.10)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;