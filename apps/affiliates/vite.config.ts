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
      port: 5176,
      hmr: {
        overlay: true,
      },
    },
    build: {
      sourcemap: !isProd,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-router")) return "router";
            if (id.match(/node_modules\/react(\/|\\)/)) return "react";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("zustand")) return "zustand";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("msw")) return "msw";
            return "vendor";
          },
        },
      },
    },
  };
});
