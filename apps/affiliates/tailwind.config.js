import sharedConfig from "../../packages/config/tailwind/tailwind.config.js";
import designTokens from "@babybook/config/design-tokens";

/** @type {import('tailwindcss').Config} */
const { fonts, radii } = designTokens;

const config = {
  darkMode: "class",
  presets: [sharedConfig],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bb-color-bg)",
        foreground: "var(--bb-color-ink)",
        surface: "var(--bb-color-surface)",
        "surface-muted": "var(--bb-color-muted)",
        ink: "var(--bb-color-ink)",
        "ink-muted": "var(--bb-color-ink-muted)",
        muted: "var(--bb-color-muted)",
        accent: "var(--bb-color-accent)",
        "accent-soft": "var(--bb-color-accent-soft)",
        danger: "var(--bb-color-danger)",
        "danger-soft": "var(--bb-color-danger-soft)",
        success: "var(--bb-color-success)",
        border: "var(--bb-color-border)",
        ring: "var(--bb-color-accent)",
        primary: {
          DEFAULT: "var(--bb-color-accent)",
          foreground: "var(--bb-color-surface)",
        },
        secondary: {
          DEFAULT: "var(--bb-color-ink)",
          foreground: "var(--bb-color-bg)",
        },
      },
      fontFamily: {
        sans: fonts.sans,
        serif: fonts.serif,
      },
      borderRadius: {
        sm: radii.sm,
        DEFAULT: radii.md,
        md: radii.md,
        lg: radii.lg,
        xl: `calc(${radii.lg} + 4px)`,
        "2xl": "2.5rem",
        pill: radii.pill,
      },
    },
  },
  plugins: [],
};

export default config;
