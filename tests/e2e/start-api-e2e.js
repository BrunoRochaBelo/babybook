#!/usr/bin/env node

/*
 * Start API for Playwright E2E
 *
 * - Runs DB migrations and seeds using the admin CLI
 * - Starts Uvicorn (FastAPI) on port 8000
 *
 * This script is used by Playwright `webServer` so it must keep running.
 */

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

function resolvePython(rootDir) {
  if (process.env.PYTHON) return process.env.PYTHON;

  const venvPython =
    process.platform === "win32"
      ? path.join(rootDir, ".venv", "Scripts", "python.exe")
      : path.join(rootDir, ".venv", "bin", "python");

  if (fs.existsSync(venvPython)) return venvPython;
  return "python";
}

const PYTHON_BIN = resolvePython(ROOT);

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.E2E_DATABASE_URL ??
  "postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_e2e";

const pyPathEntries = [
  process.env.PYTHONPATH,
  path.join(ROOT, "apps", "admin"),
  path.join(ROOT, "apps", "api"),
  path.join(ROOT, "apps", "workers"),
].filter(Boolean);

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  BABYBOOK_DATABASE_URL: databaseUrl,
  PYTHONPATH: pyPathEntries.join(path.delimiter),
};

function parseDbName(url) {
  const match = url.match(/\/([^/?]+)(?:\?|$)/);
  return match?.[1] ?? "";
}

function resetDatabaseIfNeeded() {
  const dbName = parseDbName(databaseUrl);
  const shouldReset =
    dbName.endsWith("_e2e") || process.env.E2E_RESET_DB === "1";
  if (!shouldReset) return;

  const pythonCode = `
import asyncio
from urllib.parse import urlparse

import asyncpg
import os

url = os.environ["BABYBOOK_DATABASE_URL"]
url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
p = urlparse(url)

db = (p.path or "").lstrip("/")
user = p.username or "babybook"
password = p.password or "babybook"
host = p.hostname or "localhost"
port = p.port or 5432
admin_db = os.environ.get("E2E_ADMIN_DB", "postgres")


async def main():
    conn = await asyncpg.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=admin_db,
    )
    await conn.execute(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
        db,
    )
    await conn.execute(f'DROP DATABASE IF EXISTS "{db}"')
    await conn.execute(f'CREATE DATABASE "{db}"')
    await conn.close()


asyncio.run(main())
`.trim();

  const result = spawnSync(PYTHON_BIN, ["-c", pythonCode], {
    cwd: ROOT,
    stdio: "inherit",
    env,
    shell: false,
  });

  const code = typeof result.status === "number" ? result.status : 1;
  if (code !== 0) process.exit(code);
}

function runAdminCommand(args) {
  const result = spawnSync(PYTHON_BIN, ["-m", "babybook_admin.cli", ...args], {
    cwd: ROOT,
    stdio: "inherit",
    env,
    shell: false,
  });

  const code = typeof result.status === "number" ? result.status : 1;
  if (code !== 0) process.exit(code);
}

// Prepare DB before starting the API server.
resetDatabaseIfNeeded();
runAdminCommand(["migrate"]);
runAdminCommand(["seed-moment-templates"]);
runAdminCommand(["seed-base-plan"]);
runAdminCommand(["seed-demo-data"]);

const port = process.env.PORT ?? "8000";

const uvicornArgs = [
  "-m",
  "uvicorn",
  "babybook_api.main:app",
  "--app-dir",
  "apps/api",
  "--host",
  "127.0.0.1",
  "--port",
  port,
];

const proc = spawn(PYTHON_BIN, uvicornArgs, {
  cwd: ROOT,
  stdio: "inherit",
  env,
  shell: false,
});

proc.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(typeof code === "number" ? code : 1);
});

process.on("SIGINT", () => {
  proc.kill("SIGINT");
});
process.on("SIGTERM", () => {
  proc.kill("SIGTERM");
});
