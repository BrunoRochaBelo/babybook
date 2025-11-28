// vite.config.ts
import { defineConfig } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.1_terser@5.44.1/node_modules/vite/dist/node/index.js";
import { visualizer } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/rollup-plugin-visualizer@6.0.5_rollup@2.79.2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { imagetools } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/vite-imagetools@5.1.2_rollup@2.79.2/node_modules/vite-imagetools/dist/index.js";
import { VitePWA } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/vite-plugin-pwa@1.1.0_vite@5.4.21_@types+node@22.19.1_terser@5.44.1__workbox-build@7.4.0_@typ_7usnfxymj747qf3kzjes3p5hvu/node_modules/vite-plugin-pwa/dist/index.js";
import fs from "fs";
import path from "path";
var vite_config_default = defineConfig({
  server: {
    port: 3e3
  },
  optimizeDeps: {
    include: ["lenis"]
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
            "./src/core/pwa.ts"
          ],
          // Utils - Shared utilities
          utils: [
            "./src/utils/config.ts",
            "./src/utils/logger.ts",
            "./src/utils/performance.ts",
            "./src/utils/featureFlags.ts",
            "./src/utils/observerPool.ts"
          ],
          // Features - Heavy animations and interactions
          features: [
            "./src/features/animations/hero.ts",
            "./src/features/animations/sections.ts",
            "./src/features/animations/scroll-effects.ts",
            "./src/features/interactive/carousel.ts",
            "./src/features/interactive/accordion.ts",
            "./src/features/interactive/buttons.ts"
          ],
          // Advanced - Optimization features (lazy loaded)
          advanced: [
            "./src/utils/lazyLoader.ts",
            "./src/utils/prefetch.ts",
            "./src/utils/resourceHints.ts",
            "./src/utils/imageOptimizer.ts",
            "./src/utils/criticalCSS.ts",
            "./src/utils/performanceBudget.ts"
          ]
        }
      }
    },
    // Tamanho de chunk para warnings
    chunkSizeWarningLimit: 500,
    // Minificação agressiva
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Source maps apenas em dev
    sourcemap: false
  },
  plugins: [
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.has("format")) {
          return url.searchParams;
        }
        return new URLSearchParams({
          format: "avif;webp;jpg",
          quality: "80"
        });
      }
    }),
    // Plugin customizado para inline de critical CSS usando Beasties
    {
      name: "vite-plugin-beasties",
      apply: "build",
      enforce: "post",
      async writeBundle(options, bundle) {
        const Beasties = (await import("file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/beasties@0.3.5/node_modules/beasties/dist/index.mjs")).default;
        const beasties = new Beasties({
          path: options.dir || "dist",
          pruneSource: true,
          // Remove CSS inlined do main bundle
          mergeStylesheets: true,
          preload: "media",
          noscriptFallback: true,
          logLevel: "info"
        });
        const htmlFiles = Object.keys(bundle).filter(
          (f) => f.endsWith(".html")
        );
        for (const htmlFile of htmlFiles) {
          const htmlPath = path.join(options.dir || "dist", htmlFile);
          const html = fs.readFileSync(htmlPath, "utf-8");
          const inlinedHtml = await beasties.process(html);
          fs.writeFileSync(htmlPath, inlinedHtml);
        }
      }
    },
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap"
      // 'sunburst', 'treemap', 'network'
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      manifest: {
        // minimal manifest; we also keep the public/manifest.json
        short_name: "Baby Book",
        name: "Baby Book - Livro Digital do Beb\xEA",
        start_url: "/",
        display: "standalone",
        theme_color: "#F2995D",
        background_color: "#F7F3EF",
        icons: [
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,webp,avif,ico}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      },
      devOptions: {
        enabled: false
        // Service Worker apenas em produção
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxicnVub1xcXFxPbmVEcml2ZVxcXFxUZW1wXFxcXHNvdXJjZVxcXFxyZXBvc1xcXFxiYWJ5Ym9va1xcXFxiYWJ5Ym9va1xcXFxsYW5kaW5ncGFnZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYnJ1bm9cXFxcT25lRHJpdmVcXFxcVGVtcFxcXFxzb3VyY2VcXFxccmVwb3NcXFxcYmFieWJvb2tcXFxcYmFieWJvb2tcXFxcbGFuZGluZ3BhZ2VcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2JydW5vL09uZURyaXZlL1RlbXAvc291cmNlL3JlcG9zL2JhYnlib29rL2JhYnlib29rL2xhbmRpbmdwYWdlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcclxuaW1wb3J0IHsgaW1hZ2V0b29scyB9IGZyb20gXCJ2aXRlLWltYWdldG9vbHNcIjtcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcImxlbmlzXCJdLFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmsgLSBMZW5pcyAoc2Nyb2xsaW5nIGxpYnJhcnkpXHJcbiAgICAgICAgICB2ZW5kb3I6IFtcImxlbmlzXCJdLFxyXG5cclxuICAgICAgICAgIC8vIENvcmUgZmVhdHVyZXMgLSBBbHdheXMgbmVlZGVkXHJcbiAgICAgICAgICBjb3JlOiBbXHJcbiAgICAgICAgICAgIFwiLi9zcmMvY29yZS9zY3JvbGwudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9jb3JlL25hdmlnYXRpb24udHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9jb3JlL3B3YS50c1wiLFxyXG4gICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAvLyBVdGlscyAtIFNoYXJlZCB1dGlsaXRpZXNcclxuICAgICAgICAgIHV0aWxzOiBbXHJcbiAgICAgICAgICAgIFwiLi9zcmMvdXRpbHMvY29uZmlnLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvdXRpbHMvbG9nZ2VyLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvdXRpbHMvcGVyZm9ybWFuY2UudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9mZWF0dXJlRmxhZ3MudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9vYnNlcnZlclBvb2wudHNcIixcclxuICAgICAgICAgIF0sXHJcblxyXG4gICAgICAgICAgLy8gRmVhdHVyZXMgLSBIZWF2eSBhbmltYXRpb25zIGFuZCBpbnRlcmFjdGlvbnNcclxuICAgICAgICAgIGZlYXR1cmVzOiBbXHJcbiAgICAgICAgICAgIFwiLi9zcmMvZmVhdHVyZXMvYW5pbWF0aW9ucy9oZXJvLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvZmVhdHVyZXMvYW5pbWF0aW9ucy9zZWN0aW9ucy50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2ZlYXR1cmVzL2FuaW1hdGlvbnMvc2Nyb2xsLWVmZmVjdHMudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9mZWF0dXJlcy9pbnRlcmFjdGl2ZS9jYXJvdXNlbC50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2ZlYXR1cmVzL2ludGVyYWN0aXZlL2FjY29yZGlvbi50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2ZlYXR1cmVzL2ludGVyYWN0aXZlL2J1dHRvbnMudHNcIixcclxuICAgICAgICAgIF0sXHJcblxyXG4gICAgICAgICAgLy8gQWR2YW5jZWQgLSBPcHRpbWl6YXRpb24gZmVhdHVyZXMgKGxhenkgbG9hZGVkKVxyXG4gICAgICAgICAgYWR2YW5jZWQ6IFtcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9sYXp5TG9hZGVyLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvdXRpbHMvcHJlZmV0Y2gudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9yZXNvdXJjZUhpbnRzLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvdXRpbHMvaW1hZ2VPcHRpbWl6ZXIudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9jcml0aWNhbENTUy50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL3V0aWxzL3BlcmZvcm1hbmNlQnVkZ2V0LnRzXCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgLy8gVGFtYW5obyBkZSBjaHVuayBwYXJhIHdhcm5pbmdzXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcclxuICAgIC8vIE1pbmlmaWNhXHUwMEU3XHUwMEUzbyBhZ3Jlc3NpdmFcclxuICAgIG1pbmlmeTogXCJ0ZXJzZXJcIixcclxuICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgY29tcHJlc3M6IHtcclxuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsIC8vIFJlbW92ZSBjb25zb2xlLmxvZyBlbSBwcm9kdVx1MDBFN1x1MDBFM29cclxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxyXG4gICAgICAgIHB1cmVfZnVuY3M6IFtcImNvbnNvbGUubG9nXCIsIFwiY29uc29sZS5pbmZvXCIsIFwiY29uc29sZS5kZWJ1Z1wiXSxcclxuICAgICAgICBwYXNzZXM6IDIsXHJcbiAgICAgIH0sXHJcbiAgICAgIG1hbmdsZToge1xyXG4gICAgICAgIHNhZmFyaTEwOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICBmb3JtYXQ6IHtcclxuICAgICAgICBjb21tZW50czogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgLy8gU291cmNlIG1hcHMgYXBlbmFzIGVtIGRldlxyXG4gICAgc291cmNlbWFwOiBmYWxzZSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIGltYWdldG9vbHMoe1xyXG4gICAgICBkZWZhdWx0RGlyZWN0aXZlczogKHVybCkgPT4ge1xyXG4gICAgICAgIC8vIFBhcmEgaW1hZ2VucyBubyBwcm9qZXRvLCBnZXJhciBXZWJQIGUgQVZJRiBhdXRvbWF0aWNhbWVudGVcclxuICAgICAgICBpZiAodXJsLnNlYXJjaFBhcmFtcy5oYXMoXCJmb3JtYXRcIikpIHtcclxuICAgICAgICAgIHJldHVybiB1cmwuc2VhcmNoUGFyYW1zO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBEZWZhdWx0OiBnZXJhciBtXHUwMEZBbHRpcGxvcyBmb3JtYXRvc1xyXG4gICAgICAgIHJldHVybiBuZXcgVVJMU2VhcmNoUGFyYW1zKHtcclxuICAgICAgICAgIGZvcm1hdDogXCJhdmlmO3dlYnA7anBnXCIsXHJcbiAgICAgICAgICBxdWFsaXR5OiBcIjgwXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIC8vIFBsdWdpbiBjdXN0b21pemFkbyBwYXJhIGlubGluZSBkZSBjcml0aWNhbCBDU1MgdXNhbmRvIEJlYXN0aWVzXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwidml0ZS1wbHVnaW4tYmVhc3RpZXNcIixcclxuICAgICAgYXBwbHk6IFwiYnVpbGRcIixcclxuICAgICAgZW5mb3JjZTogXCJwb3N0XCIsXHJcbiAgICAgIGFzeW5jIHdyaXRlQnVuZGxlKG9wdGlvbnMsIGJ1bmRsZSkge1xyXG4gICAgICAgIC8vIEltcG9ydGFcdTAwRTdcdTAwRTNvIGRpblx1MDBFMm1pY2EgZG8gQmVhc3RpZXNcclxuICAgICAgICBjb25zdCBCZWFzdGllcyA9IChhd2FpdCBpbXBvcnQoXCJiZWFzdGllc1wiKSkuZGVmYXVsdDtcclxuICAgICAgICBjb25zdCBiZWFzdGllcyA9IG5ldyBCZWFzdGllcyh7XHJcbiAgICAgICAgICBwYXRoOiBvcHRpb25zLmRpciB8fCBcImRpc3RcIixcclxuICAgICAgICAgIHBydW5lU291cmNlOiB0cnVlLCAvLyBSZW1vdmUgQ1NTIGlubGluZWQgZG8gbWFpbiBidW5kbGVcclxuICAgICAgICAgIG1lcmdlU3R5bGVzaGVldHM6IHRydWUsXHJcbiAgICAgICAgICBwcmVsb2FkOiBcIm1lZGlhXCIsXHJcbiAgICAgICAgICBub3NjcmlwdEZhbGxiYWNrOiB0cnVlLFxyXG4gICAgICAgICAgbG9nTGV2ZWw6IFwiaW5mb1wiLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBQcm9jZXNzYXIgdG9kb3Mgb3MgYXJxdWl2b3MgSFRNTFxyXG4gICAgICAgIGNvbnN0IGh0bWxGaWxlcyA9IE9iamVjdC5rZXlzKGJ1bmRsZSkuZmlsdGVyKChmKSA9PlxyXG4gICAgICAgICAgZi5lbmRzV2l0aChcIi5odG1sXCIpLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgZm9yIChjb25zdCBodG1sRmlsZSBvZiBodG1sRmlsZXMpIHtcclxuICAgICAgICAgIGNvbnN0IGh0bWxQYXRoID0gcGF0aC5qb2luKG9wdGlvbnMuZGlyIHx8IFwiZGlzdFwiLCBodG1sRmlsZSk7XHJcbiAgICAgICAgICBjb25zdCBodG1sID0gZnMucmVhZEZpbGVTeW5jKGh0bWxQYXRoLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgY29uc3QgaW5saW5lZEh0bWwgPSBhd2FpdCBiZWFzdGllcy5wcm9jZXNzKGh0bWwpO1xyXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhodG1sUGF0aCwgaW5saW5lZEh0bWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICB2aXN1YWxpemVyKHtcclxuICAgICAgZmlsZW5hbWU6IFwiLi9kaXN0L3N0YXRzLmh0bWxcIixcclxuICAgICAgb3BlbjogZmFsc2UsXHJcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxyXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxyXG4gICAgICB0ZW1wbGF0ZTogXCJ0cmVlbWFwXCIsIC8vICdzdW5idXJzdCcsICd0cmVlbWFwJywgJ25ldHdvcmsnXHJcbiAgICB9KSBhcyBhbnksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgc3RyYXRlZ2llczogXCJpbmplY3RNYW5pZmVzdFwiLFxyXG4gICAgICBzcmNEaXI6IFwic3JjXCIsXHJcbiAgICAgIGZpbGVuYW1lOiBcInN3LnRzXCIsXHJcbiAgICAgIGluamVjdFJlZ2lzdGVyOiBcImF1dG9cIixcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAvLyBtaW5pbWFsIG1hbmlmZXN0OyB3ZSBhbHNvIGtlZXAgdGhlIHB1YmxpYy9tYW5pZmVzdC5qc29uXHJcbiAgICAgICAgc2hvcnRfbmFtZTogXCJCYWJ5IEJvb2tcIixcclxuICAgICAgICBuYW1lOiBcIkJhYnkgQm9vayAtIExpdnJvIERpZ2l0YWwgZG8gQmViXHUwMEVBXCIsXHJcbiAgICAgICAgc3RhcnRfdXJsOiBcIi9cIixcclxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcclxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjRjI5OTVEXCIsXHJcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjRjdGM0VGXCIsXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIHsgc3JjOiBcIi9pY29uLTE5Mi5zdmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIiB9LFxyXG4gICAgICAgICAgeyBzcmM6IFwiL2ljb24tNTEyLnN2Z1wiLCBzaXplczogXCI1MTJ4NTEyXCIsIHR5cGU6IFwiaW1hZ2Uvc3ZnK3htbFwiIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsc3ZnLHBuZyxqcGcsd2VicCxhdmlmLGljb31cIl0sXHJcbiAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDYgKiAxMDI0ICogMTAyNCxcclxuICAgICAgfSxcclxuICAgICAgZGV2T3B0aW9uczoge1xyXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLCAvLyBTZXJ2aWNlIFdvcmtlciBhcGVuYXMgZW0gcHJvZHVcdTAwRTdcdTAwRTNvXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICBdLFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyWixTQUFTLG9CQUFvQjtBQUN4YixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBRWpCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsT0FBTztBQUFBLEVBQ25CO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLFFBQVEsQ0FBQyxPQUFPO0FBQUE7QUFBQSxVQUdoQixNQUFNO0FBQUEsWUFDSjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBO0FBQUEsVUFHQSxPQUFPO0FBQUEsWUFDTDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUdBLFVBQVU7QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUdBLFVBQVU7QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBO0FBQUEsUUFDZCxlQUFlO0FBQUEsUUFDZixZQUFZLENBQUMsZUFBZSxnQkFBZ0IsZUFBZTtBQUFBLFFBQzNELFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixVQUFVO0FBQUEsTUFDWjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxXQUFXO0FBQUEsTUFDVCxtQkFBbUIsQ0FBQyxRQUFRO0FBRTFCLFlBQUksSUFBSSxhQUFhLElBQUksUUFBUSxHQUFHO0FBQ2xDLGlCQUFPLElBQUk7QUFBQSxRQUNiO0FBRUEsZUFBTyxJQUFJLGdCQUFnQjtBQUFBLFVBQ3pCLFFBQVE7QUFBQSxVQUNSLFNBQVM7QUFBQSxRQUNYLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRixDQUFDO0FBQUE7QUFBQSxJQUVEO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsTUFDUCxTQUFTO0FBQUEsTUFDVCxNQUFNLFlBQVksU0FBUyxRQUFRO0FBRWpDLGNBQU0sWUFBWSxNQUFNLE9BQU8sNElBQVUsR0FBRztBQUM1QyxjQUFNLFdBQVcsSUFBSSxTQUFTO0FBQUEsVUFDNUIsTUFBTSxRQUFRLE9BQU87QUFBQSxVQUNyQixhQUFhO0FBQUE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULGtCQUFrQjtBQUFBLFVBQ2xCLFVBQVU7QUFBQSxRQUNaLENBQUM7QUFHRCxjQUFNLFlBQVksT0FBTyxLQUFLLE1BQU0sRUFBRTtBQUFBLFVBQU8sQ0FBQyxNQUM1QyxFQUFFLFNBQVMsT0FBTztBQUFBLFFBQ3BCO0FBQ0EsbUJBQVcsWUFBWSxXQUFXO0FBQ2hDLGdCQUFNLFdBQVcsS0FBSyxLQUFLLFFBQVEsT0FBTyxRQUFRLFFBQVE7QUFDMUQsZ0JBQU0sT0FBTyxHQUFHLGFBQWEsVUFBVSxPQUFPO0FBQzlDLGdCQUFNLGNBQWMsTUFBTSxTQUFTLFFBQVEsSUFBSTtBQUMvQyxhQUFHLGNBQWMsVUFBVSxXQUFXO0FBQUEsUUFDeEM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsV0FBVztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLE1BQ1osVUFBVTtBQUFBO0FBQUEsSUFDWixDQUFDO0FBQUEsSUFDRCxRQUFRO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixRQUFRO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixnQkFBZ0I7QUFBQSxNQUNoQixVQUFVO0FBQUE7QUFBQSxRQUVSLFlBQVk7QUFBQSxRQUNaLE1BQU07QUFBQSxRQUNOLFdBQVc7QUFBQSxRQUNYLFNBQVM7QUFBQSxRQUNULGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLE9BQU87QUFBQSxVQUNMLEVBQUUsS0FBSyxpQkFBaUIsT0FBTyxXQUFXLE1BQU0sZ0JBQWdCO0FBQUEsVUFDaEUsRUFBRSxLQUFLLGlCQUFpQixPQUFPLFdBQVcsTUFBTSxnQkFBZ0I7QUFBQSxRQUNsRTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGNBQWMsQ0FBQyw4Q0FBOEM7QUFBQSxRQUM3RCwrQkFBK0IsSUFBSSxPQUFPO0FBQUEsTUFDNUM7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFNBQVM7QUFBQTtBQUFBLE1BQ1g7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
