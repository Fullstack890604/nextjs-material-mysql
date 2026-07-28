import { spawn } from "node:child_process";

/**
 * Khởi chạy Next.js với HOST/PORT lấy từ biến môi trường (.env).
 * Dùng: node --env-file-if-exists=.env scripts/server.mjs [dev|start]
 */
const mode = process.argv[2] === "start" ? "start" : "dev";
const host = (process.env.HOST || "localhost").trim();
const port = (process.env.PORT || "3000").trim();

const args = [mode, "-H", host, "-p", port];
console.log(`\n> next ${args.join(" ")}  (http://${host}:${port})\n`);

const child = spawn("next", args, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
