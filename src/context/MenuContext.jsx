"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

const MenuContext = createContext({ menus: [], loading: true });

// Chuẩn hóa path từ DB (đảm bảo bắt đầu bằng "/")
const normalizePath = (p) => {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  return s.startsWith("/") ? s : `/${s}`;
};

// Quyền mặc định khi trang KHÔNG nằm trong danh sách menu phân quyền
// (vd: trang chủ) -> cho phép đầy đủ để không khóa nhầm.
const FULL_PERMISSIONS = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canPrint: true,
  canExport: true,
  canImport: true,
  canReport: true,
  found: false,
};

const truthy = (v) => v === true || v === 1;


/**
 * Tải menu phân quyền của người dùng một lần và chia sẻ cho toàn bộ admin
 * (Sidebar, Breadcrumbs...) để tránh gọi API trùng lặp.
 */
export function MenuProvider({ children }) {
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.username) {
      setMenus([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/menus?username=${encodeURIComponent(user.username)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setMenus(d.status === "OK" && Array.isArray(d.data) ? d.data : []);
      })
      .catch(() => {
        if (active) setMenus([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.username]);

  return (
    <MenuContext.Provider value={{ menus, loading }}>
      {children}
    </MenuContext.Provider>
  );
}

export const useMenus = () => useContext(MenuContext);

/**
 * Quyền của trang hiện tại (theo pathname), tra từ menu phân quyền.
 * Khớp path chính xác, nếu không lấy path là tiền tố dài nhất (cho trang con/chi tiết).
 * Trả về: { canView, canCreate, canEdit, canDelete, canPrint, canExport,
 *           canImport, canReport, found, loading }.
 */
export function usePagePermissions(targetPath) {
  const { menus, loading } = useMenus();
  const pathname = usePathname();
  const path = targetPath || pathname;

  return useMemo(() => {
    let current = null;
    let bestLen = -1;
    for (const m of menus) {
      const p = normalizePath(m.path);
      if (!p) continue;
      if (p === path) {
        current = m;
        break;
      }
      if (path.startsWith(p + "/") && p.length > bestLen) {
        current = m;
        bestLen = p.length;
      }
    }

    if (!current) return { ...FULL_PERMISSIONS, loading };

    return {
      canView: truthy(current.canView),
      canCreate: truthy(current.canCreate),
      canEdit: truthy(current.canEdit),
      canDelete: truthy(current.canDelete),
      canPrint: truthy(current.canPrint),
      canExport: truthy(current.canExport),
      canImport: truthy(current.canImport),
      canReport: truthy(current.canReport),
      found: true,
      loading,
    };
  }, [menus, path, loading]);
}
