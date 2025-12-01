import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
    },
  },
});
