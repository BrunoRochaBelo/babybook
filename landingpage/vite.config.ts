import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { imagetools } from "vite-imagetools";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

export default defineConfig({
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ["lenis"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - Lenis (scrolling library)
          vendor: ["lenis"],

          // Core features - Always needed
          core: [
            "./src/core/scroll.ts",
            "./src/core/navigation.ts",
            "./src/core/pwa.ts",
          ],

          // Utils - Shared utilities
          utils: [
            "./src/utils/config.ts",
            "./src/utils/logger.ts",
            "./src/utils/performance.ts",
            "./src/utils/featureFlags.ts",
            "./src/utils/observerPool.ts",
          ],

          // Features - Heavy animations and interactions
          features: [
            "./src/features/animations/hero.ts",
            "./src/features/animations/sections.ts",
            "./src/features/animations/scroll-effects.ts",
            "./src/features/interactive/carousel.ts",
            "./src/features/interactive/accordion.ts",
            "./src/features/interactive/buttons.ts",
          ],

          // Advanced - Optimization features (lazy loaded)
          advanced: [
            "./src/utils/lazyLoader.ts",
            "./src/utils/prefetch.ts",
            "./src/utils/resourceHints.ts",
            "./src/utils/imageOptimizer.ts",
            "./src/utils/criticalCSS.ts",
            "./src/utils/performanceBudget.ts",
          ],
        },
      },
    },
    // Tamanho de chunk para warnings
    chunkSizeWarningLimit: 500,
    // Minificação agressiva
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // Source maps apenas em dev
    sourcemap: false,
  },
  plugins: [
    imagetools({
      defaultDirectives: (url) => {
        // Para imagens no projeto, gerar WebP e AVIF automaticamente
        if (url.searchParams.has("format")) {
          return url.searchParams;
        }
        // Default: gerar múltiplos formatos
        return new URLSearchParams({
          format: "avif;webp;jpg",
          quality: "80",
        });
      },
    }),
    // Plugin customizado para inline de critical CSS usando Beasties
    {
      name: "vite-plugin-beasties",
      apply: "build",
      enforce: "post",
      async writeBundle(options, bundle) {
        // Importação dinâmica do Beasties
        const Beasties = (await import("beasties")).default;
        const beasties = new Beasties({
          path: options.dir || "dist",
          pruneSource: true, // Remove CSS inlined do main bundle
          mergeStylesheets: true,
          preload: "media",
          noscriptFallback: true,
          logLevel: "info",
        });

        // Processar todos os arquivos HTML
        const htmlFiles = Object.keys(bundle).filter((f) =>
          f.endsWith(".html"),
        );
        for (const htmlFile of htmlFiles) {
          const htmlPath = path.join(options.dir || "dist", htmlFile);
          const html = fs.readFileSync(htmlPath, "utf-8");
          const inlinedHtml = await beasties.process(html);
          fs.writeFileSync(htmlPath, inlinedHtml);
        }
      },
    },
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap", // 'sunburst', 'treemap', 'network'
    }) as any,
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      manifest: {
        // minimal manifest; we also keep the public/manifest.json
        short_name: "Baby Book",
        name: "Baby Book - Livro Digital do Bebê",
        start_url: "/",
        display: "standalone",
        theme_color: "#F2995D",
        background_color: "#F7F3EF",
        icons: [
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,webp,avif,ico}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: false, // Service Worker apenas em produção
      },
    }),
  ],
});
