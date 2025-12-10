import sharedConfig from "../packages/config/tailwind/tailwind.config.js";
import designTokens from "@babybook/config/design-tokens";

/** @type {import('tailwindcss').Config} */
const { colors, fonts, radii } = designTokens;

export default {
  presets: [sharedConfig],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Safelist mínimo para classes dinâmicas
    "animate-pulse",
    "animate-spin",
  ],
  theme: {
    screens: {
      xs: "375px", // Extra small devices
      sm: "640px", // Small devices
      md: "768px", // Medium devices
      lg: "1024px", // Large devices
      xl: "1280px", // Extra large devices
      "2xl": "1536px", // 2X large devices
    },
    extend: {
      fontFamily: {
        sans: fonts.sans,
        serif: fonts.serif,
      },
      colors: {
        // === Paleta Base do Design System ===
        cream: colors.background, // #F7F3EF - fundo creme quente
        ink: colors.ink, // #2A2A2A - texto principal
        paper: colors.surfaceMuted, // #FDF9F5 - superfície suave

        // === Cor de Ação Principal (Laranja Quente) ===
        accent: {
          50: "#FEF7F0", // Quase branco com toque quente
          100: colors.accentSoft, // #FAD5B8 - fundo sutil de badges/labels
          200: "#F7C49A", // Borda sutil
          300: "#F5B07A", // Hover de elementos suaves
          400: "#F4A06A", // Intermediário
          500: colors.accent, // #F2995D - cor principal de ação
          600: "#E88A4D", // Hover de botões
          700: "#D97F45", // Active/pressed
          800: "#C06E3B", // Texto sobre fundo claro (contraste alto)
          900: "#9A5830", // Texto escuro sobre fundos claros
        },

        // === Cor Secundária (Sage Verde - Calma) ===
        sage: {
          50: "#F4F6F3", // Fundo muito sutil
          100: "#E8ECE6", // Fundo de cards alternativos
          200: colors.muted, // #C9D3C2 - borda/divisores suaves
          300: "#B5C2AC", // Hover suave
          400: "#A1B096", // Intermediário
          500: colors.success, // #8C9B87 - sucesso/confirmação
          600: "#7A8B75", // Texto sobre fundos claros
          700: "#687563", // Texto com mais contraste
          800: "#565F51", // Texto escuro
          900: "#444A40", // Máximo contraste
        },

        // === Mapeamento indigo -> accent (compatibilidade) ===
        // Permite que classes existentes como bg-indigo-600 funcionem
        // NOTA: tons ajustados para garantir contraste WCAG AA
        // Tons claros (100-400): texto sobre fundo escuro
        // Tons escuros (700-900): texto sobre fundo claro
        // PREMIUM: Tons mais vibrantes e saturados para impacto visual
        indigo: {
          50: "#FEF7F0",
          100: "#FAE5D3", // mais saturado que accentSoft
          200: "#F7D4B8", // texto sutil sobre fundo escuro
          300: "#F4C29D", // texto médio sobre fundo escuro
          400: "#F3B07F", // texto claro sobre fundo escuro
          500: "#F2995D", // cor principal (mantida)
          600: "#EF8A47", // main action - mais vibrante e saturado
          700: "#E67935", // hover - vibrante com bom contraste
          800: "#C96328", // pressed/active - mais escuro
          900: "#A0501F", // texto máximo contraste
        },

        // === Cores Semânticas ===
        danger: {
          50: "#FEF5F5",
          100: "#FCEAEA",
          200: "#F5CACA",
          300: "#EBABAB",
          400: "#DB8A8A",
          500: colors.danger, // #C76A6A
          600: "#B35A5A",
          700: "#994D4D",
          800: "#7A3D3D",
          900: "#5C2E2E",
        },

        // === Bordas e Superfícies ===
        border: {
          subtle: colors.borderSubtle, // #E3DBCF
          DEFAULT: "#D9D0C4",
          strong: "#C9BFB1",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        // Gradientes quentes para seções
        "gradient-warm": "linear-gradient(135deg, #F7F3EF 0%, #FDF9F5 100%)",
        "gradient-accent": "linear-gradient(135deg, #F2995D 0%, #F5B07A 100%)",
        // PREMIUM: Gradientes vibrantes para CTAs e elementos de destaque
        "gradient-accent-vibrant":
          "linear-gradient(135deg, #EF8A47 0%, #F3B07F 50%, #F7D4B8 100%)",
        "gradient-glow":
          "radial-gradient(circle at 50% 0%, rgba(239, 138, 71, 0.15), transparent 70%)",
      },
      boxShadow: {
        // Sombras quentes ao invés de sombras frias (indigo)
        accent: "0 4px 14px -2px rgba(242, 153, 93, 0.25)",
        "accent-lg": "0 10px 25px -5px rgba(242, 153, 93, 0.3)",
        "accent-xl": "0 20px 40px -10px rgba(242, 153, 93, 0.35)",
        soft: "0 4px 20px -5px rgba(42, 42, 42, 0.08)",
        "soft-lg": "0 10px 40px -10px rgba(42, 42, 42, 0.12)",
        // PREMIUM: Sombras coloridas com glow para elementos interativos
        "glow-sm":
          "0 0 20px -5px rgba(239, 138, 71, 0.4), 0 4px 14px -2px rgba(242, 153, 93, 0.25)",
        "glow-md":
          "0 0 30px -5px rgba(239, 138, 71, 0.5), 0 10px 25px -5px rgba(242, 153, 93, 0.35)",
        "glow-lg":
          "0 0 40px -5px rgba(239, 138, 71, 0.6), 0 20px 40px -10px rgba(242, 153, 93, 0.45)",
      },
    },
  },
  plugins: [],
};
