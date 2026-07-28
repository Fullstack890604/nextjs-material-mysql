"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  CircularProgress,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Dashboard,
  People,
  CalendarMonth,
  Payments,
  BarChart,
  Settings,
  ManageAccounts,
  Category,
  MedicalInformation,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useMenus } from "@/context/MenuContext";
import { resolveIcon, DefaultIcon } from "./MenuIcons";

/* const menuItems = [
  { label: "Tổng quan", href: "/", icon: Dashboard },
  { label: "Bệnh nhân", href: "/patients", icon: People },
  { label: "Lịch hẹn", href: "/appointments", icon: CalendarMonth },
  { label: "Điều trị", href: "/treatments", icon: MedicalServices },
  { label: "Thanh toán", href: "/payments", icon: Payments },
  { label: "Báo cáo", href: "/reports", icon: BarChart },
  {
    label: "Cài đặt",
    href: "/settings",
    icon: Settings,
    children: [
      {
        label: "Quản lý tài khoản",
        href: "/settings/accounts",
        icon: ManageAccounts,
      },
      {
        label: "Danh mục",
        icon: Category,
        children: [
          {
            label: "Tiền sử bệnh",
            href: "/settings/categories/medical-history",
            icon: MedicalInformation,
          },
        ],
      },
    ],
  },
]; */

const EXPANDED_WIDTH = 310;
const COLLAPSED_WIDTH = 80;

const isActivePath = (href, pathname) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

const hasChildren = (item) =>
  Array.isArray(item.children) && item.children.length > 0;

const nodeKey = (item) => item.id ?? item.label;

const firstHref = (item) => {
  if (item.href) return item.href;
  for (const c of item.children || []) {
    const h = firstHref(c);
    if (h) return h;
  }
  return null;
};

const isDescendantActive = (item, pathname) => {
  if (item.href && isActivePath(item.href, pathname)) return true;
  return (item.children || []).some((c) => isDescendantActive(c, pathname));
};

// Chuẩn hóa path từ DB (đảm bảo bắt đầu bằng "/")
const normalizePath = (p) => {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  return s.startsWith("/") ? s : `/${s}`;
};

// Dựng cây menu từ danh sách phẳng (Id/ParentId) trả về từ API
const buildMenuTree = (rows) => {
  const byId = new Map();
  rows.forEach((r) => byId.set(r.id, { row: r, children: [] }));
  const roots = [];
  rows.forEach((r) => {
    const node = byId.get(r.id);
    const parent = r.parentId ? byId.get(r.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const toItem = (n) => {
    const children = n.children.map(toItem);
    return {
      id: n.row.id,
      label: n.row.text || n.row.name,
      href: normalizePath(n.row.path),
      icon: resolveIcon(n.row.icon),
      iconColor: n.row.iconColor || "primary.main",
      children: children.length ? children : undefined,
    };
  };
  return roots.map(toItem);
};

export default function Sidebar({ collapsed }) {
  const pathname = usePathname();
  const { menus, loading } = useMenus();
  const items = useMemo(
    () => (menus.length ? buildMenuTree(menus) : []),
    [menus]
  );
  const [openMap, setOpenMap] = useState(() => ({}));
  const toggle = (key) =>
    setOpenMap((m) => ({ ...m, [key]: !m[key] }));

  // Popover menu con khi sidebar thu gọn (hiển thị dạng icon)
  const [flyoutAnchor, setFlyoutAnchor] = useState(null);
  const [flyoutItem, setFlyoutItem] = useState(null);
  const openFlyout = (e, item) => {
    setFlyoutAnchor(e.currentTarget);
    setFlyoutItem(item);
  };
  const closeFlyout = () => {
    setFlyoutAnchor(null);
    setFlyoutItem(null);
  };

  const renderNode = (item, depth) => {
    const Icon = item.icon;
    const iconSx = item.iconColor ? { color: item.iconColor } : undefined;
    const iconFont = item.icon === DefaultIcon ? 18 : 28;

    // Nhóm có menu con nhưng sidebar đang thu gọn -> click mở popover menu con
    if (hasChildren(item) && collapsed) {
      const active = isDescendantActive(item, pathname);
      return (
        <Tooltip key={nodeKey(item)} title={item.label} placement="right">
          <ListItemButton
            selected={active}
            onClick={(e) => openFlyout(e, item)}
            sx={{
              mb: 0.25,
              minHeight: 32,
              justifyContent: "center",
              pl: 1,
              pr: 1.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
              <Icon sx={{ fontSize: iconFont, ...iconSx }} />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      );
    }

    // Nhóm có menu con (chỉ mở rộng khi sidebar không thu gọn)
    if (hasChildren(item) && !collapsed) {
      const open = !!openMap[nodeKey(item)];
      const active = isDescendantActive(item, pathname);
      return (
        <Box key={nodeKey(item)}>
          <ListItemButton
            selected={active}
            onClick={() => toggle(nodeKey(item))}
            sx={{ mb: 0.25, minHeight: depth > 0 ? 26 : 32, borderRadius: 1.5, pl: depth > 0 ? 1.25 : 1.5, pr: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 1.25, justifyContent: "center" }}>
              <Icon sx={{ fontSize: iconFont, ...iconSx }} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: { noWrap: false, fontSize: depth > 0 ? 15 : undefined },
              }}
            />
            {open ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </ListItemButton>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                ml: 2.75,
                pl: 0.75,
                borderLeft: "1px solid",
                borderColor: "divider",
              }}
            >
              <List disablePadding>
                {item.children.map((c) => renderNode(c, depth + 1))}
              </List>
            </Box>
          </Collapse>
        </Box>
      );
    }

    // Mục lá (hoặc nhóm khi sidebar thu gọn -> link tới trang đầu tiên)
    const href = item.href || firstHref(item) || "#";
    const active = item.href ? isActivePath(item.href, pathname) : false;
    return (
      <Tooltip
        key={nodeKey(item)}
        title={collapsed ? item.label : ""}
        placement="right"
      >
        <ListItemButton
          component={Link}
          href={href}
          selected={active}
          sx={{
            mb: 0.25,
            minHeight: depth > 0 ? 26 : 32,
            borderRadius: 1.5,
            justifyContent: collapsed ? "center" : "flex-start",
            pl: collapsed ? 1 : depth > 0 ? 1.25 : 1.5,
            pr: 1.5,
          }}
        >
          <ListItemIcon
            sx={{ minWidth: 0, mr: collapsed ? 0 : 1.25, justifyContent: "center" }}
          >
            <Icon sx={{ fontSize: iconFont, ...iconSx }} />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: { noWrap: false, fontSize: depth > 0 ? 15 : undefined },
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    );
  };

  // Render danh sách menu con bên trong popover (khi sidebar thu gọn)
  const renderFlyoutItems = (nodes, depth = 0) =>
    (nodes || []).map((node) => {
      const Icon = node.icon;
      const iconSx = node.iconColor ? { color: node.iconColor } : undefined;
      if (hasChildren(node)) {
        return (
          <Box key={nodeKey(node)}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                pt: 1,
                pb: 0.25,
                pl: 2 + depth * 1.5,
                pr: 2,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {node.label}
            </Typography>
            {renderFlyoutItems(node.children, depth + 1)}
          </Box>
        );
      }
      const href = node.href || "#";
      const active = node.href ? isActivePath(node.href, pathname) : false;
      return (
        <MenuItem
          key={nodeKey(node)}
          component={Link}
          href={href}
          selected={active}
          onClick={closeFlyout}
          sx={{ pl: 2 + depth * 1.5, minHeight: 34, gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 0 }}>
            <Icon sx={{ fontSize: 22, ...iconSx }} />
          </ListItemIcon>
          <ListItemText primary={node.label} slotProps={{ primary: { noWrap: false } }} />
        </MenuItem>
      );
    });

  return (
    <Box
      component="aside"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        transition: (theme) =>
          theme.transitions.create("width", {
            duration: theme.transitions.duration.standard,
          }),
        overflow: "hidden",
      }}
    >
      <Box
        component={Link}
        href="/"
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          borderBottom: 1,
          borderColor: "divider",
          textDecoration: "none",
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Dashboard fontSize="small" />
        </Box>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main" noWrap lineHeight={1.2}>
              NextJS - Material UI
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Analytics Platform
            </Typography>
          </Box>
        )}
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1.5 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={collapsed ? 24 : 28} />
          </Box>
        ) : (
          items.map((item) => (
            <Fragment key={nodeKey(item)}>
              {renderNode(item, 0)}
            </Fragment>
          ))
        )}
      </List>

      {/* Popover menu con khi sidebar thu gọn */}
      <Menu
        anchorEl={flyoutAnchor}
        open={Boolean(flyoutAnchor)}
        onClose={closeFlyout}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { ml: 1, minWidth: 240, maxWidth: 320 } } }}
      >
        {flyoutItem && [
          <Typography key="__title" sx={{ px: 2, py: 1, fontWeight: 700 }} noWrap>
            {flyoutItem.label}
          </Typography>,
          ...renderFlyoutItems(flyoutItem.children, 0),
        ]}
      </Menu>

      {!collapsed && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.disabled">
              © {new Date().getFullYear()} NextJS - Material UI
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
