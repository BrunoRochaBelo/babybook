import { defineConfig } from "@playwright/test";

const reuse = !process.env.CI;
const rootDir = "../..";
const apiBase = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8000";

export default defineConfig({
  testDir: "./tests",
  timeout: 90 * 1000,
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    storageState: "./.auth-state.json"
  },
  webServer: [
    {
      command: `pnpm --dir ${rootDir} dev:api`,
      port: 8000,
      reuseExistingServer: reuse,
      env: {
        DATABASE_URL:
          process.env.E2E_DATABASE_URL ??
          "postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_dev"
      }
    },
    {
      command: `pnpm --dir ${rootDir} preview:web`,
      port: 4173,
      reuseExistingServer: reuse,
      env: {
        VITE_API_BASE_URL: apiBase
      }
    },
    {
      command: `pnpm --dir ${rootDir} --filter @babybook/edge dev --port 8787 --binding "API_BASE_URL=${apiBase}"`,
      port: 8787,
      reuseExistingServer: reuse
    }
  ]
});
