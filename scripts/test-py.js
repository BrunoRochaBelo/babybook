#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const isWin = process.platform === "win32";

function resolveVenvPython() {
  const candidates = isWin
    ? [path.join(process.cwd(), ".venv", "Scripts", "python.exe")]
    : [path.join(process.cwd(), ".venv", "bin", "python")];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function main() {
  const python = resolveVenvPython() ?? "python";

  const args = ["-m", "pytest"];

  const result = spawnSync(python, args, { stdio: "inherit", shell: false });

  // spawnSync may return null status when terminated by signal.
  const code = typeof result.status === "number" ? result.status : 1;
  process.exit(code);
}

main();
