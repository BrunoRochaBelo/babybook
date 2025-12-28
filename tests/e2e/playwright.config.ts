import { defineConfig } from "@playwright/test";

const reuse = !process.env.CI;
const rootDir = "../..";
const apiPort = Number(process.env.E2E_API_PORT ?? "8000");
const landingPort = Number(process.env.E2E_LANDING_PORT ?? "4174");
const apiBase =
  process.env.E2E_API_BASE_URL ??
  `http://127.0.0.1:${Number.isFinite(apiPort) ? apiPort : 8000}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 90 * 1000,
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: `node ${rootDir}/tests/e2e/start-api-e2e.js`,
      port: Number.isFinite(apiPort) ? apiPort : 8000,
      reuseExistingServer: reuse,
      env: {
        PORT: String(Number.isFinite(apiPort) ? apiPort : 8000),
        // Usado pelo OAuth dev-mock para redirecionar de volta ao SPA.
        FRONTEND_URL: "http://127.0.0.1:4173",
        // O frontend do E2E roda em http://127.0.0.1:4173 (vite preview).
        // Precisamos permitir esse origin para que fetch() com credentials envie/receba cookies.
        CORS_ORIGINS: JSON.stringify([
          "http://127.0.0.1:4173",
          "http://localhost:4173",
        ]),
        DATABASE_URL:
          process.env.E2E_DATABASE_URL ??
          "postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_e2e",
      },
    },
    {
      command: `pnpm --dir ${rootDir} preview:web`,
      port: 4173,
      reuseExistingServer: reuse,
      env: {
        // `apps/web/.env.local` deixa MSW ligado por padrão.
        // No E2E rodamos `vite build` (MODE=production), então o MSW NÃO inicia,
        // mas o api-client passaria a forçar mocks e tentar `/api` -> quebra tudo.
        VITE_ENABLE_MSW: "false",
        VITE_API_BASE_URL: apiBase,
      },
    },
    {
      // Landingpage é um app separado (marketing) e tem testes próprios no Playwright.
      // Mantemos em uma porta distinta da web app (4173) para não conflitar.
      command: `pnpm --dir ${rootDir} --filter @babybook/landingpage build && pnpm --dir ${rootDir} --filter @babybook/landingpage preview --host 0.0.0.0 --port ${Number.isFinite(landingPort) ? landingPort : 4174}`,
      port: Number.isFinite(landingPort) ? landingPort : 4174,
      reuseExistingServer: reuse,
    },
    {
      // Wrangler usa a sintaxe KEY:VALUE para --var (não KEY=VALUE).
      // No Windows, passar args pelo `pnpm run dev` pode inserir um "--" literal no comando do wrangler,
      // fazendo-o parar de interpretar flags. Para evitar isso, executamos o wrangler diretamente.
      command: `pnpm --dir ${rootDir} --filter @babybook/edge exec wrangler dev src/index.ts --port 8787 --env dev --var API_BASE_URL:${apiBase}`,
      port: 8787,
      reuseExistingServer: reuse,
    },
  ],
});
