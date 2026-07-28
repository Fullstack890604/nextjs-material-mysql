/**
 * Tập hợp regex/hàm kiểm tra định dạng dùng chung cho toàn bộ ứng dụng.
 * Thêm regex mới (mã số thuế, CCCD, ...) vào đây để tái sử dụng ở nhiều nơi.
 */

/**
 * Số điện thoại Việt Nam (di động + cố định).
 * Chấp nhận tiền tố "0", "84" hoặc "+84".
 *
 * Di động: 10 số, đầu số theo quy hoạch hiện hành của Bộ TT&TT
 *   03[2-9], 05[2689], 07[06-9], 08[1-9], 09[0-46-9]
 * Cố định: 10-11 số, mã vùng bắt đầu bằng "02"
 */
export const VN_PHONE_REGEX =
  /^(?:\+84|84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$|^(?:\+84|84|0)2\d\d{7,8}$/;

/** Bỏ khoảng trắng, dấu chấm, gạch ngang, ngoặc trước khi kiểm tra/lưu. */
export const normalizePhone = (value = "") => value.replace(/[\s.\-()]/g, "");

/** Độ dài tối đa của SĐT sau khi chuẩn hóa: "+84" + 9 số. */
export const PHONE_MAX_LENGTH = 12;

/**
 * Ràng buộc dữ liệu gõ vào ô số điện thoại: chỉ giữ chữ số, cho phép đúng 1 dấu
 * "+" ở đầu (dạng +84...), và chặn ở PHONE_MAX_LENGTH ký tự. Dùng trong onChange
 * để người dùng không gõ được ký tự vô nghĩa, thay vì đợi báo lỗi sau khi gõ.
 */
export const sanitizePhoneInput = (value = "") => {
  const hasPlus = value.trimStart().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return `${hasPlus ? "+" : ""}${digits}`.slice(0, PHONE_MAX_LENGTH);
};

export const isValidVNPhone = (value) =>
  !!value && VN_PHONE_REGEX.test(normalizePhone(value));

/**
 * Email cơ bản (đủ dùng cho validate phía client/server,
 * không nhằm bao quát toàn bộ RFC 5322).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) =>
  !!value && EMAIL_REGEX.test(value.trim());
