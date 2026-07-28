import crypto from "crypto";

/** Băm mật khẩu theo chuẩn hệ thống: SHA-256(input UTF-8) -> Base64. */
export function hashPassword(input) {
  return crypto.createHash("sha256").update(String(input), "utf8").digest("base64");
}

/**
 * Xác thực mật khẩu nhập vào so với giá trị lưu trong cột [Password].
 *
 * Hệ thống SASCO lưu mật khẩu dạng: SHA-256(input) mã hóa Base64
 * (ví dụ '300891' -> 'ktj6bt9kv3n9AZFfPeL3yBkd3/YqSt5FV+bG7/gCjPc=').
 *
 * Vẫn giữ thêm vài dạng dự phòng (hex, MD5...) và tùy chọn plaintext
 * để linh hoạt, nhưng dạng chính là SHA-256 Base64.
 */
export function verifyPassword(input, stored) {
  if (stored == null || input == null) return false;

  const s = String(stored).trim();
  if (!s) return false;

  // Dạng chính: SHA-256 Base64 (so khớp phân biệt hoa/thường)
  const sha256Base64 = crypto
    .createHash("sha256")
    .update(input, "utf8")
    .digest("base64");
  if (s === sha256Base64) return true;

  // Dự phòng: các dạng hex (không phân biệt hoa/thường)
  const lower = s.toLowerCase();
  const hexCandidates = [
    crypto.createHash("sha256").update(input, "utf8").digest("hex"),
    crypto.createHash("sha1").update(input, "utf8").digest("hex"),
    crypto.createHash("md5").update(input, "utf8").digest("hex"),
  ].map((h) => h.toLowerCase());
  if (hexCandidates.includes(lower)) return true;

  // Tùy chọn: mật khẩu lưu dạng thô
  if (process.env.ALLOW_PLAINTEXT_PASSWORD === "true") {
    return String(stored) === String(input);
  }

  return false;
}

