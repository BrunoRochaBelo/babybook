import sharedConfig from "../../packages/config/tailwind/tailwind.config.js";
import designTokens from "@babybook/config/design-tokens";

/** @type {import('tailwindcss').Config} */
const { colors, fonts, radii } = designTokens;

const config = {
  presets: [sharedConfig],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: colors.background,
        foreground: colors.ink,
        surface: colors.surface,
        "surface-muted": colors.surfaceMuted,
        ink: colors.ink,
        "ink-muted": colors.inkMuted,
        muted: colors.muted,
        accent: colors.accent,
        "accent-soft": colors.accentSoft,
        danger: colors.danger,
        "danger-soft": colors.dangerSoft,
        success: colors.success,
        border: colors.borderSubtle,
        input: colors.surface,
        ring: colors.accent,
        primary: {
          DEFAULT: colors.accent,
          foreground: colors.surface,
        },
        secondary: {
          DEFAULT: colors.ink,
          foreground: colors.background,
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
