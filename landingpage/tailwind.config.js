import sharedConfig from "../packages/config/tailwind/tailwind.config.js";
import designTokens from "@babybook/config/design-tokens";

/** @type {import('tailwindcss').Config} */
const { colors, fonts, radii } = designTokens;

export default {
  presets: [sharedConfig],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: fonts.sans,
        serif: fonts.serif,
      },
      colors: {
        'cream': colors.background,
        'ink': colors.ink,
        'indigo-baby': colors.accent, // Mapping requested indigo to our accent (orange)
        'paper': colors.surfaceMuted,
        // Add other mappings if necessary to support the user's class names
        'indigo': {
            50: colors.accentSoft,
            100: colors.accentSoft,
            500: colors.accent,
            600: colors.accent, // Main action color
            700: '#D97F45', // Darker accent for hover
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
