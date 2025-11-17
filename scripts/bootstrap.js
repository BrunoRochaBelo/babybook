#!/usr/bin/env node
const { spawn } = require("child_process");
const platform = process.platform;
const isWin = platform === "win32";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Exit " + code)),
    );
    p.on("error", reject);
  });
}

async function main() {
  try {
    console.log("Running pnpm install...");
    await run("pnpm", ["install"]);

    if (isWin) {
      console.log(
        "Windows detected: creating virtualenv and installing Python deps",
      );
      await run("pnpm", ["run", "setup:py:win"]);
    } else {
      console.log(
        "Unix-like detected: creating virtualenv and installing Python deps",
      );
      await run("pnpm", ["run", "setup:py:unix"]);
    }

    console.log(
      "\n✅ Bootstrap complete. Run `pnpm run dev:all` (auto platform-detect) or `pnpm run dev:all:lite`.",
    );
  } catch (e) {
    console.error("\n❌ Bootstrap failed:", e.message || e);
    process.exit(1);
  }
}

main();
