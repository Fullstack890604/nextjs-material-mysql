"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
  Typography,
  Box,
} from "@mui/material";
import { Home, NavigateNext } from "@mui/icons-material";
import { useMenus } from "@/context/MenuContext";

// Chuẩn hóa path (đảm bảo bắt đầu bằng "/")
const normalizePath = (p) => {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  return s.startsWith("/") ? s : `/${s}`;
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { menus } = useMenus();

  // Trang chủ không cần breadcrumb
  if (pathname === "/") return null;

  const byId = new Map();
  menus.forEach((m) => byId.set(m.id, m));

  // Tìm node khớp: ưu tiên khớp chính xác, nếu không lấy path là tiền tố dài nhất
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

  // Dựng chuỗi tổ tiên (gốc -> hiện tại)
  const trail = [];
  let node = current;
  const guard = new Set();
  while (node && !guard.has(node.id)) {
    guard.add(node.id);
    trail.unshift(node);
    node = node.parentId ? byId.get(node.parentId) : null;
  }

  return (
    <Box sx={{ px: 3, py: 0.8, borderBottom: 1, borderColor: "divider" }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
      >
        <MuiLink
          component={Link}
          href="/"
          underline="hover"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Home fontSize="small" />
          Trang chủ
        </MuiLink>

        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          const label = item.text || item.name;
          const href = normalizePath(item.path);
          if (isLast || !href) {
            return (
              <Typography key={item.id} color="text.secondary">
                {label}
              </Typography>
            );
          }
          return (
            <MuiLink
              key={item.id}
              component={Link}
              href={href}
              underline="hover"
              color="inherit"
            >
              {label}
            </MuiLink>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
