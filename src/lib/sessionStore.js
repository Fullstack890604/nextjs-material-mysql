import { query, execute } from "@/lib/db";

/**
 * Quản lý "phiên hiện hành" của mỗi tài khoản để giới hạn 1 phiên/tài khoản
 * (Cách 1 — last wins: máy đăng nhập sau sẽ vô hiệu máy trước).
 *
 * Lưu CurrentSessionId trong bảng SysAccounts. Mỗi lần đăng nhập sinh một
 * sid mới và ghi đè; token mang theo sid, request nào có sid khác với DB
 * sẽ bị coi là phiên cũ và bị đăng xuất.
 *
 * Chỉ dùng ở Node runtime (route handler), KHÔNG dùng trong Edge middleware.
 */

// Cache ngắn hạn theo username -> { sid, expires } để giảm truy vấn DB.
const cache = new Map();
const CACHE_TTL_MS = 5000;

/** Gán sid mới cho tài khoản (khi đăng nhập). */
export async function setCurrentSession(username, sid) {
  await execute(
    `UPDATE \`SysAccounts\`
        SET \`CurrentSessionId\` = :sid
      WHERE \`UserName\` = :username`,
    { sid, username }
  );
  cache.set(username, { sid, expires: Date.now() + CACHE_TTL_MS });
}

/** Xóa phiên hiện hành (khi đăng xuất). */
export async function clearCurrentSession(username) {
  if (!username) return;
  await execute(
    `UPDATE \`SysAccounts\`
        SET \`CurrentSessionId\` = NULL
      WHERE \`UserName\` = :username`,
    { username }
  );
  cache.delete(username);
}

/** Kiểm tra sid có đúng là phiên hiện hành của tài khoản không. */
export async function isSessionCurrent(username, sid) {
  if (!username || !sid) return false;

  const cached = cache.get(username);
  if (cached && cached.expires > Date.now()) {
    return cached.sid != null && cached.sid === sid;
  }

  const rows = await query(
    `SELECT \`CurrentSessionId\`
       FROM \`SysAccounts\`
      WHERE \`UserName\` = :username
      LIMIT 1`,
    { username }
  );
  const current = rows[0]?.CurrentSessionId || null;
  cache.set(username, { sid: current, expires: Date.now() + CACHE_TTL_MS });
  return current != null && current === sid;
}
