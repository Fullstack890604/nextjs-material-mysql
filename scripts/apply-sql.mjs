/**
 * Áp dụng một file SQL (migration hoặc CREATE TABLE) vào MySQL/MariaDB.
 *
 * Dùng:
 *   node --env-file-if-exists=.env scripts/apply-sql.mjs <đường-dẫn-file.sql>
 *   npm run db:apply -- database/migrations/2026-07-25_Appointment_add_CancelReason.sql
 *
 * Đọc cấu hình DB từ biến môi trường (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD).
 * File .sql được gửi nguyên khối với multipleStatements, các câu lệnh phân tách
 * bằng dấu `;`. An toàn để chạy lại nếu script dùng IF NOT EXISTS / DROP ... IF EXISTS.
 */
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Thiếu tham số: đường dẫn file .sql cần áp dụng.");
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(filePath)) {
  console.error("Không tìm thấy file:", filePath);
  process.exit(1);
}

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  charset: "utf8mb4",
};

const script = fs.readFileSync(filePath, "utf8");

const conn = await mysql.createConnection(config);
try {
  console.log(
    `Đang áp dụng ${path.basename(filePath)} vào ${config.database}@${config.host} ...`
  );
  const [results] = await conn.query(script);
  // Câu lệnh SELECT (nếu có) trả về mảng các dòng — in ra cho dễ kiểm tra.
  for (const r of Array.isArray(results) ? results : [results]) {
    if (Array.isArray(r) && r.length) console.table(r);
  }
  console.log("✔ Hoàn tất.");
} catch (err) {
  console.error("✗ Lỗi khi áp dụng:", err.sqlMessage || err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
