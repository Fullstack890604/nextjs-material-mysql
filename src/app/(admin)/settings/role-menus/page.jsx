"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Refresh, Save, AdminPanelSettings, SubdirectoryArrowRight, FolderOpen } from "@mui/icons-material";
import AutocompleteField from "@/components/AutocompleteField";
import PageHeader from "@/components/PageHeader";
import { usePagePermissions } from "@/context/MenuContext";
import { useToast } from "@/context/ToastContext";

const headCellSx = {
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
  py: 1.5,
};

// Khớp màu với Chip trạng thái ở settings/roles để chấm tròn đồng bộ giữa 2 trang.
const roleColor = (role) => (role?.isActive === false ? "grey.400" : "success.main");

const PERMS = [
  { key: "canView", label: "Xem" },
  { key: "canCreate", label: "Thêm" },
  { key: "canEdit", label: "Sửa" },
  { key: "canDelete", label: "Xóa" },
  { key: "canPrint", label: "In" },
  { key: "canReport", label: "Báo cáo" },
  { key: "canImport", label: "Nhập" },
  { key: "canExport", label: "Xuất" },
];

const emptyPerm = () =>
  PERMS.reduce((o, p) => ({ ...o, [p.key]: false }), {});

export default function RoleMenusPage() {
  const pagePerms = usePagePermissions();
  const { notify } = useToast();
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [roleId, setRoleId] = useState("");
  const [perms, setPerms] = useState({}); // { [menuId]: { canView, ... } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [rs, ms] = await Promise.all([
        fetch("/api/sys-roles").then((r) => r.json()),
        fetch("/api/sys-menus").then((r) => r.json()),
      ]);
      if (rs.status === "OK") setRoles(rs.data || []);
      if (ms.status === "OK") setMenus(ms.data || []);
    } catch {
      notify("Không thể tải danh sách", "error");
    }
  }, [notify]);

  const loadPerms = useCallback(async (rid) => {
    if (!rid) {
      setPerms({});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sys-role-menus?roleId=${rid}`);
      const data = await res.json();
      const map = {};
      if (data.status === "OK") {
        for (const r of data.data || []) {
          map[r.menuId] = PERMS.reduce(
            (o, p) => ({ ...o, [p.key]: r[p.key] === true || r[p.key] === 1 }),
            {}
          );
        }
      }
      setPerms(map);
    } catch {
      notify("Không thể tải quyền menu", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  // AutocompleteField trả về thẳng giá trị (Id của nhóm quyền), "" khi bấm xóa.
  const onRoleChange = (rid) => {
    setRoleId(rid);
    loadPerms(rid);
  };

  const getPerm = (menuId, key) => perms[menuId]?.[key] || false;

  // Map: menuId -> danh sách toàn bộ id con/cháu (đệ quy)
  const descendantsMap = useMemo(() => {
    const childrenOf = {};
    for (const m of menus) {
      const pid = m.parentId || 0;
      (childrenOf[pid] ||= []).push(m.id);
    }
    const collect = (id) => {
      const res = [];
      for (const c of childrenOf[id] || []) res.push(c, ...collect(c));
      return res;
    };
    const map = {};
    for (const m of menus) map[m.id] = collect(m.id);
    return map;
  }, [menus]);

  const togglePerm = (menuId, key) => (e) => {
    const checked = e.target.checked;
    setPerms((prev) => {
      const next = { ...prev };
      const apply = (id) => {
        next[id] = { ...(next[id] || emptyPerm()), [key]: checked };
      };
      apply(menuId);
      // Cascade xuống toàn bộ menu con/cháu
      for (const d of descendantsMap[menuId] || []) apply(d);
      return next;
    });
  };

  const toggleColumn = (key) => (e) => {
    const checked = e.target.checked;
    setPerms((prev) => {
      const next = { ...prev };
      for (const m of menus) {
        next[m.id] = { ...(next[m.id] || emptyPerm()), [key]: checked };
      }
      return next;
    });
  };

  const columnState = (key) => {
    if (!menus.length) return { checked: false, indeterminate: false };
    const on = menus.filter((m) => getPerm(m.id, key)).length;
    return { checked: on === menus.length, indeterminate: on > 0 && on < menus.length };
  };

  const handleSave = async () => {
    if (!roleId) return notify("Vui lòng chọn nhóm quyền", "warning");
    setSaving(true);
    try {
      const permissions = menus.map((m) => ({
        menuId: m.id,
        ...PERMS.reduce((o, p) => ({ ...o, [p.key]: getPerm(m.id, p.key) }), {}),
      }));
      const res = await fetch("/api/sys-role-menus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: Number(roleId), permissions }),
      });
      const data = await res.json();
      if (data.status === "OK") {
        notify(data.message || "Đã lưu quyền menu");
      } else {
        notify(data.message || "Lưu thất bại", data.severity || "error");
      }
    } catch {
      notify("Không thể kết nối máy chủ", "error");
    } finally {
      setSaving(false);
    }
  };

  const sortedMenus = useMemo(() => {
    const byParent = new Map();
    for (const m of menus) {
      const pid = m.parentId || 0;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(m);
    }
    const sortFn = (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      String(a.text || "").localeCompare(String(b.text || ""));
    for (const arr of byParent.values()) arr.sort(sortFn);

    const ids = new Set(menus.map((m) => m.id));
    const result = [];
    const walk = (pid, level) => {
      for (const m of byParent.get(pid) || []) {
        const hasChildren = (byParent.get(m.id) || []).length > 0;
        result.push({ ...m, level, hasChildren });
        walk(m.id, level + 1);
      }
    };

    // Node gốc: parentId rỗng/0 hoặc parent không tồn tại trong danh sách
    const roots = menus
      .filter((m) => !m.parentId || !ids.has(m.parentId))
      .sort(sortFn);
    for (const r of roots) {
      const hasChildren = (byParent.get(r.id) || []).length > 0;
      result.push({ ...r, level: 0, hasChildren });
      walk(r.id, 1);
    }
    return result;
  }, [menus]);

  // Chặn truy cập nếu không có quyền xem trang
  if (pagePerms.found && !pagePerms.loading && !pagePerms.canView) {
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PageHeader
        title="Phân quyền menu"
        subtitle="Cấu hình quyền truy cập menu cho từng nhóm quyền"
        actions={
          <>
            <Button variant="outlined" color="secondary" startIcon={<Refresh />} onClick={() => loadPerms(roleId)} disabled={!roleId || loading} sx={{ width: { xs: "100%", sm: "auto" } }}>
              TRUY VẤN
            </Button>
            {pagePerms.canEdit && (
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={!roleId || saving} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Lưu
              </Button>
            )}
          </>
        }
      />

      <Card variant="outlined">
        <Stack direction="row" spacing={1} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <AutocompleteField
            size="small"
            label="Nhóm quyền"
            placeholder="Chọn nhóm quyền..."
            value={roleId}
            onChange={onRoleChange}
            options={roles}
            optionValue="id"
            optionLabel="name"
            optionCaption="description"
            searchFields={["name", "description"]}
            dotColor={roleColor}
            showDotInInput
            startIcon={<AdminPanelSettings fontSize="small" />}
            fullWidth={false}
            sx={{ maxWidth: 360, width: "100%" }}
          />
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Menu</TableCell>
                {PERMS.map((p) => {
                  const cs = columnState(p.key);
                  return (
                    <TableCell key={p.key} sx={headCellSx} align="center">
                      <Stack alignItems="center">
                        {p.label}
                        <Checkbox
                          size="small"
                          checked={cs.checked}
                          indeterminate={cs.indeterminate}
                          onChange={toggleColumn(p.key)}
                          disabled={!roleId}
                          sx={{ color: "#fff", p: 0.25, "&.Mui-checked": { color: "#fff" }, "&.MuiCheckbox-indeterminate": { color: "#fff" } }}
                        />
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={2 + PERMS.length} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && !roleId && (
                <TableRow>
                  <TableCell colSpan={2 + PERMS.length} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Chọn một nhóm quyền để cấu hình
                  </TableCell>
                </TableRow>
              )}
              {!loading && roleId && sortedMenus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2 + PERMS.length} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có menu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                roleId &&
                sortedMenus.map((m, index) => (
                  <TableRow key={m.id} hover>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell sx={{ pl: 2 + m.level * 3 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {m.level > 0 ? (
                          <SubdirectoryArrowRight fontSize="small" sx={{ color: "text.disabled" }} />
                        ) : m.hasChildren ? (
                          <FolderOpen fontSize="small" sx={{ color: "primary.main" }} />
                        ) : null}
                        <Typography variant="body2" fontWeight={m.level === 0 ? 700 : 400}>
                          {m.text}
                        </Typography>
                      </Stack>
                    </TableCell>
                    {PERMS.map((p) => {
                      const descs = m.hasChildren ? descendantsMap[m.id] || [] : [];
                      const own = getPerm(m.id, p.key);
                      const childOn = descs.filter((id) => getPerm(id, p.key)).length;
                      const indeterminate = descs.length > 0 && !own && childOn > 0;
                      return (
                        <TableCell key={p.key} align="center">
                          <Checkbox
                            size="small"
                            checked={own}
                            indeterminate={indeterminate}
                            onChange={togglePerm(m.id, p.key)}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <Backdrop open={saving} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
