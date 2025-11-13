import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60 * 1000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm --filter @babybook/web dev",
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
});
