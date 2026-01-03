import sharedConfig from "../../packages/config/tailwind/tailwind.config.js";
import designTokens from "@babybook/config/design-tokens";

/** @type {import('tailwindcss').Config} */
const { fonts, radii } = designTokens;

const config = {
  darkMode: 'class',
  presets: [sharedConfig],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores que respondem ao dark mode via variáveis CSS
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
        input: "var(--bb-color-surface)",
        ring: "var(--bb-color-accent)",
        primary: {
          DEFAULT: "var(--bb-color-accent)",
          foreground: "var(--bb-color-surface)",
        },
        secondary: {
          DEFAULT: "var(--bb-color-ink)",
          foreground: "var(--bb-color-bg)",
        },
        // Partner Portal Specific Tokens
        partner: {
          primary: "var(--partner-primary)",
          "primary-hover": "var(--partner-primary-hover)",
          "primary-light": "var(--partner-primary-light)",
          "primary-soft": "var(--partner-primary-soft)",
          "primary-glow": "var(--partner-primary-glow)",
          surface: "var(--partner-surface)",
          "surface-elevated": "var(--partner-surface-elevated)",
          "surface-muted": "var(--partner-surface-muted)",
          bg: "var(--partner-bg)",
          text: "var(--partner-text)",
          "text-secondary": "var(--partner-text-secondary)",
          "text-muted": "var(--partner-text-muted)",
          "text-subtle": "var(--partner-text-subtle)",
          border: "var(--partner-border)",
          "border-strong": "var(--partner-border-strong)",
          "border-hover": "var(--partner-border-hover)",
          success: "var(--partner-success)",
          "success-soft": "var(--partner-success-soft)",
          warning: "var(--partner-warning)",
          "warning-soft": "var(--partner-warning-soft)",
          error: "var(--partner-error)",
          "error-soft": "var(--partner-error-soft)",
          info: "var(--partner-info)",
          "info-soft": "var(--partner-info-soft)",
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
        pill: radii.pill,
      },
    },
  },
  plugins: [],
  corePlugins: {
    animation: true,
  },
};

export default config;
