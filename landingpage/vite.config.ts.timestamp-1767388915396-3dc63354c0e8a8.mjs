// vite.config.ts
import { defineConfig } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.1_terser@5.44.1/node_modules/vite/dist/node/index.js";
import { visualizer } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/rollup-plugin-visualizer@6.0.5_rollup@2.79.2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { imagetools } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/vite-imagetools@5.1.2_rollup@2.79.2/node_modules/vite-imagetools/dist/index.js";
import { VitePWA } from "file:///C:/Users/bruno/OneDrive/Temp/source/repos/babybook/babybook/node_modules/.pnpm/vite-plugin-pwa@1.1.0_vite@5.4.21_@types+node@22.19.1_terser@5.44.1__workbox-build@7.4.0_@typ_7usnfxymj747qf3kzjes3p5hvu/node_modules/vite-plugin-pwa/dist/index.js";
import fs from "fs";
import path from "path";
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\Users\\bruno\\OneDrive\\Temp\\source\\repos\\babybook\\babybook\\landingpage";
var vite_config_default = defineConfig({
  server: {
    port: 3e3
  },
  optimizeDeps: {
    include: ["lenis"]
  },
  build: {
    rollupOptions: {
      // Multi-page app: B2C (index.html) + B2B Pro (pro.html)
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html"),
        pro: resolve(__vite_injected_original_dirname, "pro.html")
      },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxicnVub1xcXFxPbmVEcml2ZVxcXFxUZW1wXFxcXHNvdXJjZVxcXFxyZXBvc1xcXFxiYWJ5Ym9va1xcXFxiYWJ5Ym9va1xcXFxsYW5kaW5ncGFnZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYnJ1bm9cXFxcT25lRHJpdmVcXFxcVGVtcFxcXFxzb3VyY2VcXFxccmVwb3NcXFxcYmFieWJvb2tcXFxcYmFieWJvb2tcXFxcbGFuZGluZ3BhZ2VcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2JydW5vL09uZURyaXZlL1RlbXAvc291cmNlL3JlcG9zL2JhYnlib29rL2JhYnlib29rL2xhbmRpbmdwYWdlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcclxuaW1wb3J0IHsgaW1hZ2V0b29scyB9IGZyb20gXCJ2aXRlLWltYWdldG9vbHNcIjtcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXCJsZW5pc1wiXSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIC8vIE11bHRpLXBhZ2UgYXBwOiBCMkMgKGluZGV4Lmh0bWwpICsgQjJCIFBybyAocHJvLmh0bWwpXHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiaW5kZXguaHRtbFwiKSxcclxuICAgICAgICBwcm86IHJlc29sdmUoX19kaXJuYW1lLCBcInByby5odG1sXCIpLFxyXG4gICAgICB9LFxyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIC8vIFZlbmRvciBjaHVuayAtIExlbmlzIChzY3JvbGxpbmcgbGlicmFyeSlcclxuICAgICAgICAgIHZlbmRvcjogW1wibGVuaXNcIl0sXHJcblxyXG4gICAgICAgICAgLy8gQ29yZSBmZWF0dXJlcyAtIEFsd2F5cyBuZWVkZWRcclxuICAgICAgICAgIGNvcmU6IFtcclxuICAgICAgICAgICAgXCIuL3NyYy9jb3JlL3Njcm9sbC50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2NvcmUvbmF2aWdhdGlvbi50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2NvcmUvcHdhLnRzXCIsXHJcbiAgICAgICAgICBdLFxyXG5cclxuICAgICAgICAgIC8vIFV0aWxzIC0gU2hhcmVkIHV0aWxpdGllc1xyXG4gICAgICAgICAgdXRpbHM6IFtcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9jb25maWcudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9sb2dnZXIudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9wZXJmb3JtYW5jZS50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL3V0aWxzL2ZlYXR1cmVGbGFncy50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL3V0aWxzL29ic2VydmVyUG9vbC50c1wiLFxyXG4gICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAvLyBGZWF0dXJlcyAtIEhlYXZ5IGFuaW1hdGlvbnMgYW5kIGludGVyYWN0aW9uc1xyXG4gICAgICAgICAgZmVhdHVyZXM6IFtcclxuICAgICAgICAgICAgXCIuL3NyYy9mZWF0dXJlcy9hbmltYXRpb25zL2hlcm8udHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9mZWF0dXJlcy9hbmltYXRpb25zL3NlY3Rpb25zLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvZmVhdHVyZXMvYW5pbWF0aW9ucy9zY3JvbGwtZWZmZWN0cy50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2ZlYXR1cmVzL2ludGVyYWN0aXZlL2Nhcm91c2VsLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvZmVhdHVyZXMvaW50ZXJhY3RpdmUvYWNjb3JkaW9uLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvZmVhdHVyZXMvaW50ZXJhY3RpdmUvYnV0dG9ucy50c1wiLFxyXG4gICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAvLyBBZHZhbmNlZCAtIE9wdGltaXphdGlvbiBmZWF0dXJlcyAobGF6eSBsb2FkZWQpXHJcbiAgICAgICAgICBhZHZhbmNlZDogW1xyXG4gICAgICAgICAgICBcIi4vc3JjL3V0aWxzL2xhenlMb2FkZXIudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9wcmVmZXRjaC50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL3V0aWxzL3Jlc291cmNlSGludHMudHNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy91dGlscy9pbWFnZU9wdGltaXplci50c1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL3V0aWxzL2NyaXRpY2FsQ1NTLnRzXCIsXHJcbiAgICAgICAgICAgIFwiLi9zcmMvdXRpbHMvcGVyZm9ybWFuY2VCdWRnZXQudHNcIixcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBUYW1hbmhvIGRlIGNodW5rIHBhcmEgd2FybmluZ3NcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxyXG4gICAgLy8gTWluaWZpY2FcdTAwRTdcdTAwRTNvIGFncmVzc2l2YVxyXG4gICAgbWluaWZ5OiBcInRlcnNlclwiLFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gUmVtb3ZlIGNvbnNvbGUubG9nIGVtIHByb2R1XHUwMEU3XHUwMEUzb1xyXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXHJcbiAgICAgICAgcHVyZV9mdW5jczogW1wiY29uc29sZS5sb2dcIiwgXCJjb25zb2xlLmluZm9cIiwgXCJjb25zb2xlLmRlYnVnXCJdLFxyXG4gICAgICAgIHBhc3NlczogMixcclxuICAgICAgfSxcclxuICAgICAgbWFuZ2xlOiB7XHJcbiAgICAgICAgc2FmYXJpMTA6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIGZvcm1hdDoge1xyXG4gICAgICAgIGNvbW1lbnRzOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBTb3VyY2UgbWFwcyBhcGVuYXMgZW0gZGV2XHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgaW1hZ2V0b29scyh7XHJcbiAgICAgIGRlZmF1bHREaXJlY3RpdmVzOiAodXJsKSA9PiB7XHJcbiAgICAgICAgLy8gUGFyYSBpbWFnZW5zIG5vIHByb2pldG8sIGdlcmFyIFdlYlAgZSBBVklGIGF1dG9tYXRpY2FtZW50ZVxyXG4gICAgICAgIGlmICh1cmwuc2VhcmNoUGFyYW1zLmhhcyhcImZvcm1hdFwiKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHVybC5zZWFyY2hQYXJhbXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIERlZmF1bHQ6IGdlcmFyIG1cdTAwRkFsdGlwbG9zIGZvcm1hdG9zXHJcbiAgICAgICAgcmV0dXJuIG5ldyBVUkxTZWFyY2hQYXJhbXMoe1xyXG4gICAgICAgICAgZm9ybWF0OiBcImF2aWY7d2VicDtqcGdcIixcclxuICAgICAgICAgIHF1YWxpdHk6IFwiODBcIixcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgLy8gUGx1Z2luIGN1c3RvbWl6YWRvIHBhcmEgaW5saW5lIGRlIGNyaXRpY2FsIENTUyB1c2FuZG8gQmVhc3RpZXNcclxuICAgIHtcclxuICAgICAgbmFtZTogXCJ2aXRlLXBsdWdpbi1iZWFzdGllc1wiLFxyXG4gICAgICBhcHBseTogXCJidWlsZFwiLFxyXG4gICAgICBlbmZvcmNlOiBcInBvc3RcIixcclxuICAgICAgYXN5bmMgd3JpdGVCdW5kbGUob3B0aW9ucywgYnVuZGxlKSB7XHJcbiAgICAgICAgLy8gSW1wb3J0YVx1MDBFN1x1MDBFM28gZGluXHUwMEUybWljYSBkbyBCZWFzdGllc1xyXG4gICAgICAgIGNvbnN0IEJlYXN0aWVzID0gKGF3YWl0IGltcG9ydChcImJlYXN0aWVzXCIpKS5kZWZhdWx0O1xyXG4gICAgICAgIGNvbnN0IGJlYXN0aWVzID0gbmV3IEJlYXN0aWVzKHtcclxuICAgICAgICAgIHBhdGg6IG9wdGlvbnMuZGlyIHx8IFwiZGlzdFwiLFxyXG4gICAgICAgICAgcHJ1bmVTb3VyY2U6IHRydWUsIC8vIFJlbW92ZSBDU1MgaW5saW5lZCBkbyBtYWluIGJ1bmRsZVxyXG4gICAgICAgICAgbWVyZ2VTdHlsZXNoZWV0czogdHJ1ZSxcclxuICAgICAgICAgIHByZWxvYWQ6IFwibWVkaWFcIixcclxuICAgICAgICAgIG5vc2NyaXB0RmFsbGJhY2s6IHRydWUsXHJcbiAgICAgICAgICBsb2dMZXZlbDogXCJpbmZvXCIsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFByb2Nlc3NhciB0b2RvcyBvcyBhcnF1aXZvcyBIVE1MXHJcbiAgICAgICAgY29uc3QgaHRtbEZpbGVzID0gT2JqZWN0LmtleXMoYnVuZGxlKS5maWx0ZXIoKGYpID0+XHJcbiAgICAgICAgICBmLmVuZHNXaXRoKFwiLmh0bWxcIiksXHJcbiAgICAgICAgKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGh0bWxGaWxlIG9mIGh0bWxGaWxlcykge1xyXG4gICAgICAgICAgY29uc3QgaHRtbFBhdGggPSBwYXRoLmpvaW4ob3B0aW9ucy5kaXIgfHwgXCJkaXN0XCIsIGh0bWxGaWxlKTtcclxuICAgICAgICAgIGNvbnN0IGh0bWwgPSBmcy5yZWFkRmlsZVN5bmMoaHRtbFBhdGgsIFwidXRmLThcIik7XHJcbiAgICAgICAgICBjb25zdCBpbmxpbmVkSHRtbCA9IGF3YWl0IGJlYXN0aWVzLnByb2Nlc3MoaHRtbCk7XHJcbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGh0bWxQYXRoLCBpbmxpbmVkSHRtbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHZpc3VhbGl6ZXIoe1xyXG4gICAgICBmaWxlbmFtZTogXCIuL2Rpc3Qvc3RhdHMuaHRtbFwiLFxyXG4gICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgZ3ppcFNpemU6IHRydWUsXHJcbiAgICAgIGJyb3RsaVNpemU6IHRydWUsXHJcbiAgICAgIHRlbXBsYXRlOiBcInRyZWVtYXBcIiwgLy8gJ3N1bmJ1cnN0JywgJ3RyZWVtYXAnLCAnbmV0d29yaydcclxuICAgIH0pIGFzIGFueSxcclxuICAgIFZpdGVQV0Eoe1xyXG4gICAgICBzdHJhdGVnaWVzOiBcImluamVjdE1hbmlmZXN0XCIsXHJcbiAgICAgIHNyY0RpcjogXCJzcmNcIixcclxuICAgICAgZmlsZW5hbWU6IFwic3cudHNcIixcclxuICAgICAgaW5qZWN0UmVnaXN0ZXI6IFwiYXV0b1wiLFxyXG4gICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIC8vIG1pbmltYWwgbWFuaWZlc3Q7IHdlIGFsc28ga2VlcCB0aGUgcHVibGljL21hbmlmZXN0Lmpzb25cclxuICAgICAgICBzaG9ydF9uYW1lOiBcIkJhYnkgQm9va1wiLFxyXG4gICAgICAgIG5hbWU6IFwiQmFieSBCb29rIC0gTGl2cm8gRGlnaXRhbCBkbyBCZWJcdTAwRUFcIixcclxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxyXG4gICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiBcIiNGMjk5NURcIixcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNGN0YzRUZcIixcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgeyBzcmM6IFwiL2ljb24tMTkyLnN2Z1wiLCBzaXplczogXCIxOTJ4MTkyXCIsIHR5cGU6IFwiaW1hZ2Uvc3ZnK3htbFwiIH0sXHJcbiAgICAgICAgICB7IHNyYzogXCIvaWNvbi01MTIuc3ZnXCIsIHNpemVzOiBcIjUxMng1MTJcIiwgdHlwZTogXCJpbWFnZS9zdmcreG1sXCIgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxzdmcscG5nLGpwZyx3ZWJwLGF2aWYsaWNvfVwiXSxcclxuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNiAqIDEwMjQgKiAxMDI0LFxyXG4gICAgICB9LFxyXG4gICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsIC8vIFNlcnZpY2UgV29ya2VyIGFwZW5hcyBlbSBwcm9kdVx1MDBFN1x1MDBFM29cclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJaLFNBQVMsb0JBQW9CO0FBQ3hiLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsZUFBZTtBQUN4QixPQUFPLFFBQVE7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
