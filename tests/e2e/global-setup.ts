import path from "node:path";
import { FullConfig, request } from "@playwright/test";

const AUTH_STATE_PATH = path.resolve(__dirname, ".auth-state.json");

export default async function globalSetup(_config: FullConfig) {
  const apiPort = Number(process.env.E2E_API_PORT ?? "8000");
  const apiBase =
    process.env.E2E_API_BASE_URL ??
    `http://127.0.0.1:${Number.isFinite(apiPort) ? apiPort : 8000}`;
  const api = await request.newContext({
    baseURL: apiBase,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  });

  const csrfResponse = await api.get("/auth/csrf");
  const { csrf_token: csrfToken } = await csrfResponse.json();

  const loginResponse = await api.post("/auth/login", {
    data: {
      email: "demo@babybook.dev",
      password: "demo123",
      csrf_token: csrfToken,
    },
  });
  if (loginResponse.status() >= 400) {
    throw new Error(
      `Falha ao autenticar usu�rio demo: ${loginResponse.status()}`,
    );
  }

  await api.storageState({ path: AUTH_STATE_PATH });
  await api.dispose();
}
