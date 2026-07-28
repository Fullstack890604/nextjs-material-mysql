import { cp, access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

/**
 * output: 'standalone' không tự copy public/, .next/static, .env và web.config
 * (nếu có, dùng cho reverse-proxy IIS) vào .next/standalone — bước này bù lại,
 * để server.js trong standalone phục vụ được file tĩnh và có đủ biến môi trường.
 *
 * server.js do Next.js sinh ra đọc process.env.PORT / process.env.HOSTNAME ngay
 * dòng đầu và KHÔNG tự nạp .env, nên bước này còn:
 *   - chèn đoạn nạp .env vào đầu server.js (xem PRELUDE) -> `node server.js`
 *     cũng chạy đúng HOST/PORT;
 *   - sinh start.mjs (xem STARTER) làm điểm khởi động có log rõ ràng.
 * Bỏ qua nếu build không sinh ra standalone.
 */
const standaloneDir = ".next/standalone";

/** Dấu nhận biết server.js đã được chèn (tránh chèn 2 lần) */
const PRELUDE_MARK = "__CRM_ENV_BOOTSTRAP__";

/**
 * Đoạn chèn vào ĐẦU .next/standalone/server.js (CommonJS): nạp .env nằm cùng
 * thư mục rồi đồng bộ HOST <-> HOSTNAME, trước khi server.js đọc 2 biến này.
 */
const PRELUDE = `/* ${PRELUDE_MARK}: đoạn dưới do scripts/copy-standalone-assets.mjs chèn sau mỗi lần
   build. server.js gốc của Next.js đọc process.env.PORT/HOSTNAME ngay bên dưới
   và không tự nạp .env, nên phải nạp .env (cạnh file này) ở đây. */
;(() => {
  const fs = require('fs');
  const envFile = require('path').join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envFile);
    } else {
      // Node < 20.12 chưa có process.loadEnvFile -> tự đọc KEY=VALUE.
      for (const line of fs.readFileSync(envFile, 'utf8').split(/\\r?\\n/)) {
        if (line.trim().startsWith('#')) continue;
        const m = /^\\s*([\\w.-]+)\\s*=\\s*(.*)$/.exec(line);
        if (!m) continue;
        const value = m[2].trim().replace(/^(['"])([\\s\\S]*)\\1$/, '$2');
        if (process.env[m[1]] === undefined) process.env[m[1]] = value;
      }
    }
  }
  // .env khai HOST, còn server.js chỉ đọc HOSTNAME. Ưu tiên HOST vì Docker /
  // Git Bash tự set HOSTNAME (id container / tên máy) sẽ ghi đè cấu hình.
  const host = process.env.HOST || process.env.HOSTNAME || '0.0.0.0';
  process.env.HOST = host;
  process.env.HOSTNAME = host;
})();

`;

/**
 * Nội dung .next/standalone/start.mjs — điểm khởi động của bản standalone.
 * server.js đọc process.env.PORT / process.env.HOSTNAME ngay dòng đầu tiên và
 * không nạp .env, nên phải nạp .env (nằm cạnh nó) TRƯỚC khi import server.js.
 */
const STARTER = `/**
 * File này do scripts/copy-standalone-assets.mjs sinh tự động sau mỗi lần build
 * — đừng sửa trực tiếp (sẽ bị ghi đè).
 *
 * Chạy bản standalone:  node start.mjs
 *
 * Vì sao cần file này: .next/standalone/server.js (Next.js tự sinh) đọc
 * process.env.PORT / process.env.HOSTNAME ngay dòng đầu và KHÔNG tự nạp .env,
 * nên chạy \\\`node server.js\\\` sẽ luôn ra cổng 3000 dù .env có khai PORT.
 * File này nạp .env nằm cùng thư mục rồi mới khởi động server.js.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, ".env");

/** Nạp .env: ưu tiên API sẵn có của Node (>= 20.12), không thì tự đọc. */
const loadEnv = (file) => {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(file);
    return;
  }
  for (const line of readFileSync(file, "utf8").split(/\\r?\\n/)) {
    const m = /^\\s*([\\w.-]+)\\s*=\\s*(.*)$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].trim().replace(/^(['"])([\\s\\S]*)\\1$/, "$2");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
};

if (existsSync(envFile)) {
  loadEnv(envFile);
  console.log(\`[standalone] Đã nạp \${envFile}\`);
} else {
  console.warn(\`[standalone] Không tìm thấy \${envFile} — dùng biến môi trường hệ thống.\`);
}

// .env của project khai HOST, còn server.js chỉ đọc HOSTNAME -> đồng bộ 2 biến.
// Ưu tiên HOST vì nhiều môi trường tự set sẵn HOSTNAME (Docker đặt bằng id
// container, Git Bash đặt bằng tên máy); nếu ưu tiên HOSTNAME thì cấu hình HOST
// trong .env sẽ bị ghi đè và server lắng nghe sai địa chỉ.
const host = process.env.HOST || process.env.HOSTNAME || "0.0.0.0";
process.env.HOST = host;
process.env.HOSTNAME = host;

const port = process.env.PORT || "3000";
console.log(\`[standalone] HOST=\${host} PORT=\${port} -> http://\${host}:\${port}\`);

// Dùng file URL vì import() với đường dẫn tuyệt đối kiểu Windows (D:\\...) sẽ lỗi.
await import(pathToFileURL(join(here, "server.js")).href);
`;

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standaloneDir))) {
    console.log("Không tìm thấy .next/standalone, bỏ qua copy assets.");
    return;
  }

  if (await exists("public")) {
    await cp("public", `${standaloneDir}/public`, { recursive: true });
    console.log("Đã copy public/ vào .next/standalone/public");
  }

  if (await exists(".next/static")) {
    await cp(".next/static", `${standaloneDir}/.next/static`, { recursive: true });
    console.log("Đã copy .next/static vào .next/standalone/.next/static");
  }

  if (await exists(".env")) {
    await cp(".env", `${standaloneDir}/.env`);
    console.log("Đã copy .env vào .next/standalone/.env");
  }

  if (await exists("web.config")) {
    await cp("web.config", `${standaloneDir}/web.config`);
    console.log("Đã copy web.config vào .next/standalone/web.config");
  }

  await patchServerJs();

  await writeFile(`${standaloneDir}/start.mjs`, STARTER, "utf8");
  console.log("Đã tạo .next/standalone/start.mjs (chạy: node start.mjs)");
}

/** Chèn PRELUDE vào đầu server.js để `node server.js` cũng đọc được .env */
async function patchServerJs() {
  const serverFile = `${standaloneDir}/server.js`;
  if (!(await exists(serverFile))) {
    console.warn("Không tìm thấy .next/standalone/server.js, bỏ qua bước chèn .env.");
    return;
  }

  const source = await readFile(serverFile, "utf8");
  if (source.includes(PRELUDE_MARK)) {
    console.log("server.js đã có đoạn nạp .env, bỏ qua.");
    return;
  }

  await writeFile(serverFile, PRELUDE + source, "utf8");
  console.log("Đã chèn đoạn nạp .env vào đầu .next/standalone/server.js");
}

main();
