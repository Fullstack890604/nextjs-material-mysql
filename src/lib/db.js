import mysql from "mysql2/promise";

/**
 * Kết nối MySQL/MariaDB đọc từ biến môi trường (.env).
 * KHÔNG commit thông tin đăng nhập DB lên git.
 *
 * Toàn bộ truy vấn đi qua `query()` / `execute()` với tham số đặt tên (:name),
 * KHÔNG nối chuỗi giá trị vào câu lệnh — xem hướng dẫn ở cuối file.
 */
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Cho phép viết :name trong câu lệnh thay vì dấu ? theo vị trí.
  namedPlaceholders: true,

  charset: "utf8mb4_unicode_ci",
  // Giá trị Date của JS được quy đổi theo giờ máy chủ ứng dụng (khớp NOW()).
  timezone: "local",
  supportBigNumbers: true,
  bigNumberStrings: false,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,

  /**
   * Giữ nguyên ngữ nghĩa dữ liệu mà tầng trên đang trông đợi:
   *
   * - TINYINT(1) -> boolean. Cột cờ (IsActive, Locked, CanView...) vốn là [bit]
   *   bên SQL Server và trả về true/false; giao diện có chỗ so sánh nghiêm ngặt
   *   `isActive === false`, nên trả 0/1 sẽ hiển thị sai trạng thái.
   * - DATE/DATETIME/TIMESTAMP -> chuỗi thô "YYYY-MM-DD HH:mm:ss[.ffffff]" theo
   *   giờ địa phương đã lưu, KHÔNG dựng thành Date. Nếu dựng Date thì khi
   *   JSON.stringify sẽ thành chuỗi UTC và bị lệch +7 lúc hiển thị.
   *   `fmtDate`/`fmtDateTime` (src/lib/dateFormat.js) đọc thẳng các thành phần
   *   trong chuỗi này.
   * - DECIMAL -> number, vì cột tiền/số lượng khai báo decimal(18,2) và tầng
   *   trên tính toán bằng số.
   */
  typeCast(field, next) {
    if (field.type === "TINY" && field.length === 1) {
      const v = field.string();
      return v === null ? null : v === "1";
    }
    if (
      field.type === "DATE" ||
      field.type === "DATETIME" ||
      field.type === "TIMESTAMP" ||
      field.type === "NEWDATE"
    ) {
      return field.string();
    }
    if (field.type === "NEWDECIMAL" || field.type === "DECIMAL") {
      const v = field.string();
      return v === null ? null : Number(v);
    }
    return next();
  },
};

let pool;

/**
 * Lấy connection pool dùng chung (khởi tạo một lần).
 * Chỉ cần dùng trực tiếp khi thao tác ngoài `query`/`execute`/`transaction`.
 */
export function getPool() {
  if (!pool) pool = mysql.createPool(config);
  return pool;
}

/**
 * Chạy câu lệnh trả về dữ liệu (SELECT). Trả về mảng các dòng.
 *
 *   const rows = await query(
 *     "SELECT Code, Name FROM PaymentMethod WHERE Code = :code",
 *     { code }
 *   );
 */
export async function query(sql, params = {}) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Như `query` nhưng chỉ lấy dòng đầu tiên (null nếu không có). */
export async function queryOne(sql, params = {}) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/**
 * Chạy câu lệnh thay đổi dữ liệu (INSERT/UPDATE/DELETE).
 * Trả về { affectedRows, changedRows, insertId }.
 *
 *   const { affectedRows } = await execute(
 *     "UPDATE PaymentMethod SET Name = :name WHERE Code = :code",
 *     { name, code }
 *   );
 */
export async function execute(sql, params = {}) {
  const [result] = await getPool().query(sql, params);
  return {
    affectedRows: result.affectedRows ?? 0,
    changedRows: result.changedRows ?? 0,
    insertId: result.insertId ?? null,
  };
}

/**
 * Chạy nhiều câu lệnh trong một transaction. Tự commit khi hàm callback
 * hoàn tất, tự rollback nếu ném lỗi.
 *
 *   await transaction(async (tx) => {
 *     await tx.execute("DELETE FROM SysRoleMenus WHERE RoleId = :id", { id });
 *     for (const m of menus) await tx.execute("INSERT INTO ...", m);
 *   });
 */
export async function transaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const tx = {
      query: async (sql, params = {}) => (await conn.query(sql, params))[0],
      queryOne: async (sql, params = {}) => (await conn.query(sql, params))[0][0] ?? null,
      execute: async (sql, params = {}) => {
        const [r] = await conn.query(sql, params);
        return {
          affectedRows: r.affectedRows ?? 0,
          changedRows: r.changedRows ?? 0,
          insertId: r.insertId ?? null,
        };
      },
    };
    const out = await fn(tx);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Ép giá trị số nguyên "tùy chọn" cho tham số SQL: trả về null khi client không gửi
 * (undefined/null/chuỗi rỗng) hoặc gửi giá trị không phải số — để câu lệnh SQL tự
 * quyết định giá trị mặc định (vd SortOrder tự tăng, hoặc giữ nguyên giá trị cũ).
 */
export function optionalInt(v) {
  if (v === null || v === undefined || v === "") return null;
  return Number.isFinite(+v) ? +v : null;
}

/**
 * Chuẩn hóa giá trị tùy chọn: undefined -> null.
 * mysql2 báo lỗi nếu tham số là undefined, nên mọi giá trị "có thể thiếu"
 * lấy từ body request đều nên đi qua đây.
 */
export function optional(v) {
  return v === undefined || v === "" ? null : v;
}
