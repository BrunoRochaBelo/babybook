import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
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
      // Segurança/perf: em produção, não gerar sourcemaps por padrão.
      // (Em dev/preview elas seguem úteis para debug.)
      sourcemap: !isProd,
      // Evita ruído de warning por chunks grandes que são esperados (ex.: workers),
      // mas ainda sinaliza quando o bundle principal crescer demais.
      chunkSizeWarningLimit: 800,
      // Chunk splitting para melhor cache em produção
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            // Framework/core
            if (id.includes("react-router")) return "router";
            if (id.match(/node_modules\/react(\/|\\)/)) return "react";

            // Data/state
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("zustand")) return "zustand";

            // UI/libs comuns
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("lucide-react")) return "icons";
            if (
              id.includes("framer-motion") ||
              id.match(/node_modules\/(motion)(\/|\\)/)
            )
              return "motion";

            // Pesados / raros (queremos fora do chunk principal)
            if (id.includes("@ffmpeg/ffmpeg") || id.includes("@ffmpeg/util"))
              return "ffmpeg";
            if (id.includes("@imgly/background-removal")) return "imgly-bg";
            if (id.includes("onnxruntime-web")) return "onnxruntime";
            if (id.includes("html2canvas")) return "html2canvas";
            if (id.includes("recharts")) return "charts";

            return "vendor";
          },
        },
      },
    },
  };
});
