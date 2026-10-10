import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, closeSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const language = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
const messages = {
  zh: {
    version: "需要 Node.js 24.11 或更高版本，请从 https://nodejs.org/ 安装。",
    install: "首次打开：正在准备组件，请保持网络连接……",
    build: "正在准备界面……",
    ready: "工作台已打开。关闭此窗口不会关闭服务。",
    failure: "启动失败。请查看 data/launcher.log，或将错误信息提供给 AI。",
    port: "端口 4318 已被其他程序占用。",
    timeout: "启动超时。请查看 data/launcher.log。",
  },
  en: {
    version: "Node.js 24.11+ is required. Install it from https://nodejs.org/.",
    install:
      "First launch: preparing components. Keep your internet connection active…",
    build: "Preparing the interface…",
    ready: "Workspace opened. Closing this window keeps the service running.",
    failure:
      "Launch failed. Check data/launcher.log or share the error with your AI.",
    port: "Port 4318 is occupied by another program.",
    timeout: "Startup timed out. Check data/launcher.log.",
  },
  ja: {
    version:
      "Node.js 24.11以降が必要です。https://nodejs.org/ からインストールしてください。",
    install:
      "初回起動：コンポーネントを準備しています。ネット接続を維持してください……",
    build: "画面を準備しています……",
    ready:
      "ワークスペースを開きました。このウィンドウを閉じてもサービスは動作します。",
    failure:
      "起動に失敗しました。data/launcher.logを確認するか、エラーをAIに伝えてください。",
    port: "ポート4318は別のプログラムが使用しています。",
    timeout:
      "起動がタイムアウトしました。data/launcher.logを確認してください。",
  },
};
const t =
  messages[
    language.startsWith("zh") ? "zh" : language.startsWith("ja") ? "ja" : "en"
  ];
const url = "http://127.0.0.1:4318";
async function healthy() {
  try {
    const response = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(1000),
    });
    const body = await response.json();
    if (body.ok === true && body.version === "0.1.0") return true;
    throw new Error(t.port);
  } catch (error) {
    if (error.message === t.port) throw error;
    if (error instanceof SyntaxError) throw new Error(t.port);
    return false;
  }
}
function run(command, args, options = {}) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      windowsHide: true,
      ...options,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? accept() : reject(new Error(`${command}: exit ${code}`)),
    );
  });
}
async function npm(command) {
  await run(
    process.env.ComSpec || "cmd.exe",
    ["/d", "/s", "/c", `npm ${command}`],
    { stdio: "inherit" },
  );
}
try {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 24 || (major === 24 && minor < 11)) throw new Error(t.version);
  if (!(await healthy())) {
    if (!existsSync(join(root, "node_modules/tsx/dist/cli.mjs"))) {
      console.log(t.install);
      await npm("ci");
    }
    if (!existsSync(join(root, "dist/web/index.html"))) {
      console.log(t.build);
      await npm("run build");
    }
    mkdirSync(join(root, "data"), { recursive: true });
    const log = openSync(join(root, "data/launcher.log"), "a");
    const child = spawn(
      process.execPath,
      [join(root, "node_modules/tsx/dist/cli.mjs"), "server/http.ts"],
      {
        cwd: root,
        detached: true,
        windowsHide: true,
        env: { ...process.env, PORT: "4318" },
        stdio: ["ignore", log, log],
      },
    );
    closeSync(log);
    let failed;
    child.once("error", (error) => {
      failed = error;
    });
    child.unref();
    const deadline = Date.now() + 30000;
    while (!(await healthy())) {
      if (failed) throw failed;
      if (child.exitCode !== null && child.exitCode !== 0)
        throw new Error(t.failure);
      if (Date.now() > deadline) throw new Error(t.timeout);
      await new Promise((accept) => setTimeout(accept, 300));
    }
  }
  await run("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `Start-Process '${url}'`,
  ]);
  console.log(t.ready);
} catch (error) {
  console.error(t.failure, "\n", error.message);
  process.exitCode = 1;
}
