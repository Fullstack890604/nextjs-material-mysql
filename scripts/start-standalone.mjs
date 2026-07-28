import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Chạy bản standalone từ thư mục gốc project.
 *
 * Việc nạp .env + map HOST -> HOSTNAME nằm trong .next/standalone/start.mjs
 * (do scripts/copy-standalone-assets.mjs sinh sau mỗi lần build), nên script
 * này chỉ gọi đúng file đó để cả 2 cách chạy — từ gốc project hay từ trong
 * thư mục standalone khi deploy — dùng chung một cơ chế.
 *
 * Dùng: npm run start:standalone
 */
const starter = ".next/standalone/start.mjs";

if (!existsSync(starter)) {
  console.error(
    `Không tìm thấy ${starter}.\n` +
      "Hãy chạy `npm run build` với output: 'standalone' đang bật trong next.config.mjs."
  );
  process.exit(1);
}

const child = spawn("node", [starter], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
