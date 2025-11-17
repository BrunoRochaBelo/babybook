#!/usr/bin/env node
const { spawn } = require("child_process");
const platform = process.platform;
const isWin = platform === "win32";
const command = isWin ? "pnpm" : "pnpm";
const args = isWin ? ["run", "dev:all:win"] : ["run", "dev:all:unix"];

const p = spawn(command, args, { stdio: "inherit", shell: true });

p.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
