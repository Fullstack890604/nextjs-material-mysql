/**
 * Định dạng ngày / ngày-giờ cho hiển thị (tiếng Việt).
 *
 * Lưu ý múi giờ: các cột kiểu date/datetime trong MySQL lưu theo giờ ĐỊA
 * PHƯƠNG (NOW()). `src/lib/db.js` cấu hình typeCast trả các cột này về dạng
 * CHUỖI thô ("2026-07-23 22:01:49") thay vì đối tượng Date — vì nếu dựng Date
 * thì khi JSON.stringify sẽ thành chuỗi UTC và bị lệch (+7) lúc hiển thị.
 * Các hàm dưới đây lấy trực tiếp thành phần ngày/giờ từ chuỗi, KHÔNG quy đổi
 * múi giờ, nên đọc được cả dạng có "T"/"Z" lẫn dạng cách bằng khoảng trắng.
 *
 * fmtDate("2026-07-23 00:00:00")           -> "23/07/2026"
 * fmtDateTime("2026-07-23 22:01:49")       -> "22:01:49 23/07/2026"
 */

/** Ngày -> "dd/mm/yyyy" (mặc định trả "—" khi rỗng). */
export const fmtDate = (v, emptyText = "—") => {
  if (!v) return emptyText;
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
};

/** Ngày giờ -> "HH:mm:ss dd/mm/yyyy" (mặc định trả "" khi rỗng). */
export const fmtDateTime = (v, emptyText = "") => {
  if (!v) return emptyText;
  const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return String(v);
  const [, y, mo, d, hh, mi, ss] = m;
  return `${hh}:${mi}${ss ? `:${ss}` : ""} ${d}/${mo}/${y}`;
};
