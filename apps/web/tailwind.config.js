const shared = {
  theme: {
    extend: {
      colors: {
        // Baby Book Design Tokens - INSPIRAÇÃO DESIGN
        // Paleta: Calma intencional, dessaturada e quente (papel antigo, argila, plantas)
        // Replicando exatamente as cores de: inspiração design/src/styles/globals.css
        background: "#FAF8F5", // Areia/quente - "fundo do álbum" (Light mode)
        foreground: "#3D3530", // Tinta/carvão - leitura confortável (Light mode)
        card: "#FFFFFF", // Branco para os cards flutuarem
        "card-foreground": "#3D3530",
        muted: "#EDE8E2", // Sálvia clara - bordas, divisórias, placeholders
        "muted-foreground": "#847B73",
        accent: "#D89B7C", // Terracota - ações secundárias
        "accent-foreground": "#3D3530",
        primary: "#E8845C", // Laranja quente - ações primárias, CTAs
        "primary-foreground": "#FFFFFF",
        secondary: "#C8D5C4", // Sálvia - para uso como accent alternativo
        "secondary-foreground": "#3D3530",
        danger: "#D4183D", // Vermelho destrutivo
        "danger-foreground": "#FFFFFF",
        border: "rgba(61, 53, 48, 0.12)", // Bordas com transparência
        input: "#F5F1EC", // Background dos inputs
        ring: "#E8845C", // Ring de focus
      },
      fontFamily: {
        // Tipografia conforme Modelagem_UI-UX.md § 1 Tipografia
        serif: ["Lora", "Merriweather", "Vollkorn", "serif"], // Títulos - "livro de histórias"
        sans: ["Inter", "Manrope", "Figtree", "system-ui", "sans-serif"], // Corpo/UI - legibilidade em mobile
      },
      fontSize: {
        // Escalas conforme Modelagem_UI-UX.md § 1 Tipografia
        // body: 16px/24px é a base
        xs: ["14px", { lineHeight: "20px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["28px", { lineHeight: "34px" }], // h1
      },
      borderRadius: {
        // Arredondamento extremo (2xl) reforça suavidade e tom "fofo"
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px", // Padrão para cards e botões
        "3xl": "32px",
      },
      boxShadow: {
        // Sombras para dar profundidade - "fotos coladas em scrapbook"
        sm: "0 1px 2px 0 rgba(42, 42, 42, 0.05)",
        DEFAULT: "0 4px 6px -1px rgba(42, 42, 42, 0.1)",
        md: "0 10px 15px -3px rgba(42, 42, 42, 0.1)",
        lg: "0 20px 25px -5px rgba(42, 42, 42, 0.15)", // Cards flutuando
        xl: "0 25px 50px -12px rgba(42, 42, 42, 0.2)",
      },
    },
  },
  plugins: [],
};

export default {
  ...shared,
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // Respeito a prefers-reduced-motion para acessibilidade
  corePlugins: {
    animation: true,
  },
};
