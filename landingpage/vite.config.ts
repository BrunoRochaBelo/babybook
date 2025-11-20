import { defineConfig } from 'vite'
// Trigger reload

export default defineConfig({
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['lenis']
  },
})
