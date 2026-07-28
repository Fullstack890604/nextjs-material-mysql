"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useMenus } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import { resolveDefaultPage } from "@/lib/defaultPage";

// Route luôn được phép (không cần menu phân quyền): trang cài đặt gốc (chỉ là
// container/index, không có nội dung riêng). Trang chủ ("/") PHẢI đi qua kiểm
// tra quyền như mọi trang khác — có menu "Tổng quan" (SysMenus.Path = "/") với
// canView theo từng vai trò, nếu bỏ qua thì gõ thẳng URL sẽ vào được dù không
// được cấp quyền.
const ALWAYS_ALLOWED = new Set(["/settings"]);

// Chuẩn hóa path từ DB (đảm bảo bắt đầu bằng "/")
const normalizePath = (p) => {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  return s.startsWith("/") ? s : `/${s}`;
};

const truthy = (v) => v === true || v === 1;

/**
 * Chặn truy cập trực tiếp (gõ URL) vào trang người dùng KHÔNG được cấp quyền.
 * Nguyên tắc fail-closed: nếu route không khớp bất kỳ menu nào có canView -> chặn.
 * Riêng trang chủ ("/"): nếu bị chặn thì chuyển hướng về trang mặc định của tài
 * khoản (SysAccounts.DefaultPage) thay vì hiện màn "Không có quyền truy cập",
 * vì "/" là nơi mọi tài khoản đều đi qua đầu tiên sau khi đăng nhập.
 */
export default function RouteGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { menus, loading } = useMenus();
  const { user } = useAuth();

  // Tìm menu khớp: chính xác, nếu không lấy path là tiền tố dài nhất (trang con/chi tiết)
  let current = null;
  let bestLen = -1;
  for (const m of menus) {
    const p = normalizePath(m.path);
    if (!p) continue;
    if (p === pathname) {
      current = m;
      break;
    }
    if (pathname.startsWith(p + "/") && p.length > bestLen) {
      current = m;
      bestLen = p.length;
    }
  }
  const allowed = current && truthy(current.canView);

  const isHome = pathname === "/";
  const defaultPage = resolveDefaultPage(user?.defaultPage);
  // Chỉ chuyển hướng khi trang mặc định khác "/" — nếu trang mặc định cũng là
  // "/" (chưa cấu hình DefaultPage) mà vẫn không có quyền thì sẽ lặp vô hạn,
  // trường hợp đó vẫn hiện màn "Không có quyền truy cập" như bình thường.
  const shouldRedirectHome = isHome && !loading && !allowed && defaultPage !== "/";

  useEffect(() => {
    if (shouldRedirectHome) router.replace(defaultPage);
  }, [shouldRedirectHome, defaultPage, router]);

  if (ALWAYS_ALLOWED.has(pathname)) return children;

  // Chờ nạp menu xong mới quyết định (tránh nháy nội dung khi chưa có quyền),
  // và giữ nguyên spinner trong lúc đang chuyển hướng khỏi trang chủ bị chặn.
  if (loading || shouldRedirectHome) {
    return (
      <Box
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 240,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!allowed) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Không có quyền truy cập
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bạn không được phép xem trang này. Vui lòng liên hệ quản trị viên.
        </Typography>
      </Box>
    );
  }

  return children;
}
