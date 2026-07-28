/**
 * Registry trong RAM cho SSE — theo dõi các kết nối đang mở của từng tài khoản
 * để đẩy sự kiện "bị đá" (đăng nhập ở nơi khác) xuống thiết bị cũ tức thì.
 *
 * Chỉ dùng ở Node runtime, giả định chạy đơn instance (self-hosted `next start`).
 *
 * subscriber = { sid: string, send(payload): void, close(): void }
 */

const registry = new Map(); // username -> Set<subscriber>
const lastLogin = new Map(); // username -> deviceInfo (thiết bị đăng nhập gần nhất)

/** Lưu thông tin thiết bị đăng nhập gần nhất của tài khoản. */
export function setLastLogin(username, info) {
  if (username) lastLogin.set(username, info || null);
}

/** Lấy thông tin thiết bị đăng nhập gần nhất. */
export function getLastLogin(username) {
  return lastLogin.get(username) || null;
}

export function addSubscriber(username, subscriber) {
  if (!username || !subscriber) return;
  if (!registry.has(username)) registry.set(username, new Set());
  registry.get(username).add(subscriber);
}

export function removeSubscriber(username, subscriber) {
  const set = registry.get(username);
  if (!set) return;
  set.delete(subscriber);
  if (set.size === 0) registry.delete(username);
}

/** Đá tất cả kết nối của tài khoản có sid KHÁC keepSid (giữ lại phiên mới). */
export function kickOthers(username, keepSid, info) {
  const set = registry.get(username);
  if (!set) return;
  const device = info || getLastLogin(username) || null;
  for (const sub of [...set]) {
    if (sub.sid !== keepSid) {
      try {
        sub.send({ type: "kicked", device });
      } catch {
        /* ignore */
      }
      try {
        sub.close();
      } catch {
        /* ignore */
      }
    }
  }
}
