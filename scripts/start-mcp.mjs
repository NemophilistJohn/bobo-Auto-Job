// Keep MCP and the visual workspace on the same data directory, regardless of
// which folder the AI host uses to launch this process.
import { spawn } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const child = spawn(
  process.execPath,
  [join(root, "node_modules/tsx/dist/cli.mjs"), "server/mcp.ts"],
  {
    cwd: root,
    env: { ...process.env, RESUME_DATA_DIR: join(root, "data") },
    stdio: "inherit",
    windowsHide: true,
  },
);
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
