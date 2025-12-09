import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use node environment for unit tests
    // Integration tests with Miniflare can use @cloudflare/vitest-pool-workers
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
