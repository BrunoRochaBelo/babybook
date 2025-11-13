import sharedConfig from "../../packages/config/tailwind/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [sharedConfig],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand Blue System - Professional palette
        background: "#f8fbff",
        foreground: "#0f172a",
        primary: "#3f6fd8",
        secondary: "#0ea5e9",
        accent: "#06b6d4",
        muted: "#94a3b8",
        "muted-foreground": "#64748b",
        border: "#e2e8f0",
        input: "#f1f5f9",
        ring: "#3f6fd8",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
  corePlugins: {
    animation: true,
  },
};

export default config;