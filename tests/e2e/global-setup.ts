import { execFileSync } from "node:child_process";
import path from "node:path";
import { FullConfig, request } from "@playwright/test";

const ROOT = path.resolve(__dirname, "..", "..");
const AUTH_STATE_PATH = path.resolve(__dirname, ".auth-state.json");
const PYTHON_BIN = process.env.PYTHON ?? "python";

const ADMIN_COMMANDS = [
  ["migrate"],
  ["seed-moment-templates"],
  ["seed-base-plan"],
  ["seed-demo-data"]
] as const;

function runAdminCommand(args: readonly string[]) {
  execFileSync(PYTHON_BIN, ["-m", "babybook_admin.cli", ...args], {
    cwd: ROOT,
    stdio: "inherit"
  });
}

export default async function globalSetup(_config: FullConfig) {
  ADMIN_COMMANDS.forEach(runAdminCommand);

  const apiBase = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8000";
  const api = await request.newContext({
    baseURL: apiBase,
    extraHTTPHeaders: {
      "Content-Type": "application/json"
    }
  });

  const csrfResponse = await api.get("/auth/csrf");
  const { csrf_token: csrfToken } = await csrfResponse.json();

  const loginResponse = await api.post("/auth/login", {
    data: {
      email: "demo@babybook.dev",
      password: "demo123",
      csrf_token: csrfToken
    }
  });
  if (loginResponse.status() >= 400) {
    throw new Error(`Falha ao autenticar usu�rio demo: ${loginResponse.status()}`);
  }

  await api.storageState({ path: AUTH_STATE_PATH });
  await api.dispose();
}
