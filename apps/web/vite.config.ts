import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    // Necessário para habilitar SharedArrayBuffer (ffmpeg.wasm) em dev.
    // Sem isso, `crossOriginIsolated` fica false e o compressor de vídeo não inicializa.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    // HMR mais estável
    hmr: {
      overlay: true, // Mostra erros como overlay
    },
  },
  // Otimizações de build
  build: {
    // Gera source maps para debug
    sourcemap: true,
    // Chunk splitting para melhor cache em produção
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
