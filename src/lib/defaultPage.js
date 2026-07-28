/**
 * Chuẩn hóa "trang mặc định" của tài khoản (SysAccounts.DefaultPage) về dạng "/xxx".
 * Rỗng/không có -> "/".
 */
export function resolveDefaultPage(defaultPage) {
  const p = (defaultPage || "").trim();
  if (!p) return "/";
  return p.startsWith("/") ? p : `/${p}`;
}
