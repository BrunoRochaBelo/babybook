export const designTokens = {
  colors: {
    background: "#F7F3EF",
    surface: "#FFFFFF",
    surfaceMuted: "#FDF9F5",
    ink: "#2A2A2A",
    inkMuted: "rgba(42, 42, 42, 0.7)",
    muted: "#C9D3C2",
    accent: "#F2995D",
    accentSoft: "#FAD5B8",
    danger: "#C76A6A",
    dangerSoft: "#F2C8C8",
    success: "#8C9B87",
    borderSubtle: "#E3DBCF",
  },
  fonts: {
    serif: ["Lora", "Georgia", "serif"],
    sans: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "sans-serif",
    ],
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    pill: "999px",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
  },
};

export type DesignTokens = typeof designTokens;

export default designTokens;
