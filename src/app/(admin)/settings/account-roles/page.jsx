"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Delete,
  Refresh,
  Person,
  AdminPanelSettings,
  Edit,
} from "@mui/icons-material";
import AutocompleteField from "@/components/AutocompleteField";
import PageHeader from "@/components/PageHeader";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import { useToast } from "@/context/ToastContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";

const headCellSx = {
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
  py: 1.5,
};

/** Màu chấm trong danh sách chọn: tài khoản bị khóa / nhóm quyền đã ngưng thì xám. */
const accountColor = (a) => (a?.locked ? "#9e9e9e" : "#2e7d32");
const roleColor = (r) => (r?.isActive === false ? "#9e9e9e" : "#2e7d32");

export default function AccountRolesPage() {
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo tài khoản, nhóm quyền...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [originalRoleIds, setOriginalRoleIds] = useState([]);
  const [form, setForm] = useState({ accountId: "", roleIds: [] });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState(null);

  const loadLookups = useCallback(async () => {
    try {
      const [as, rs] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/sys-roles").then((r) => r.json()),
      ]);
      if (as.status === "OK") setAccounts(as.data || []);
      if (rs.status === "OK") setRoles(rs.data || []);
    } catch {
      /* im lặng, dropdown sẽ trống */
    }
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sys-account-roles");
      const data = await res.json();
      if (data.status === "OK") {
        setRows(data.data || []);
      } else {
        setRows([]);
        if (data.severity === "error") notify(data.message || "Lỗi tải dữ liệu", "error");
      }
    } catch {
      notify("Không thể kết nối máy chủ", "error");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadLookups();
    loadData();
  }, [loadLookups, loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.accountName?.toLowerCase().includes(q) ||
        r.accountDescription?.toLowerCase().includes(q) ||
        r.roleName?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      if (!map.has(r.accountId)) {
        map.set(r.accountId, {
          accountId: r.accountId,
          accountName: r.accountName,
          accountDescription: r.accountDescription,
          roles: [],
        });
      }
      map.get(r.accountId).roles.push({ roleId: r.roleId, roleName: r.roleName });
    }
    return [...map.values()];
  }, [filtered]);

  const paged = useMemo(
    () => grouped.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [grouped, page, rowsPerPage]
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(grouped.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [grouped.length, rowsPerPage, page]);

  const openCreate = () => {
    setEditing(null);
    setOriginalRoleIds([]);
    setForm({ accountId: "", roleIds: [] });
    setDialogOpen(true);
  };

  const openEdit = (g) => {
    const roleIds = g.roles.map((r) => r.roleId);
    setEditing(g.accountId);
    setOriginalRoleIds(roleIds);
    setForm({ accountId: g.accountId, roleIds });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.accountId) return notify("Vui lòng chọn tài khoản", "warning");
    if (!form.roleIds.length) return notify("Vui lòng chọn nhóm quyền", "warning");
    setSaving(true);
    try {
      const accountId = Number(form.accountId);
      const selected = form.roleIds.map(Number);

      if (editing) {
        const toAdd = selected.filter((id) => !originalRoleIds.includes(id));
        const toRemove = originalRoleIds.filter((id) => !selected.includes(id));

        if (!toAdd.length && !toRemove.length) {
          notify("Không có thay đổi", "info");
          setDialogOpen(false);
          return;
        }

        if (toAdd.length) {
          await fetch("/api/sys-account-roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId, roleIds: toAdd }),
          });
        }
        for (const roleId of toRemove) {
          await fetch(
            `/api/sys-account-roles?accountId=${accountId}&roleId=${roleId}`,
            { method: "DELETE" }
          );
        }
        notify("Đã cập nhật phân quyền");
        setDialogOpen(false);
        loadData();
      } else {
        const res = await fetch("/api/sys-account-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId, roleIds: selected }),
        });
        const data = await res.json();
        if (data.status === "OK") {
          notify(data.message || "Đã gán quyền");
          setDialogOpen(false);
          loadData();
        } else {
          notify(data.message || "Thao tác thất bại", data.severity || "error");
        }
      }
    } catch {
      notify("Không thể kết nối máy chủ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/sys-account-roles?accountId=${deleteTarget.accountId}&roleId=${deleteTarget.roleId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.status === "OK") {
        notify(data.message || "Đã gỡ quyền");
        loadData();
      } else {
        notify(data.message || "Gỡ quyền thất bại", data.severity || "error");
      }
    } catch {
      notify("Không thể kết nối máy chủ", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountTarget) return;
    try {
      for (const role of deleteAccountTarget.roles) {
        await fetch(
          `/api/sys-account-roles?accountId=${deleteAccountTarget.accountId}&roleId=${role.roleId}`,
          { method: "DELETE" }
        );
      }
      notify("Đã xóa phân quyền tài khoản");
      loadData();
    } catch {
      notify("Không thể kết nối máy chủ", "error");
    } finally {
      setDeleteAccountTarget(null);
    }
  };

  // Chặn truy cập nếu không có quyền xem trang
  if (perms.found && !perms.loading && !perms.canView) {
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
        title="Phân quyền tài khoản"
        subtitle="Gán nhóm quyền cho từng tài khoản người dùng"
        actions={
          <>
            <Button variant="outlined" color="secondary" startIcon={<Refresh />} onClick={loadData} disabled={refreshing} sx={{ width: { xs: "100%", sm: "auto" } }}>
              TRUY VẤN
            </Button>
            {perms.canCreate && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Gán quyền
              </Button>
            )}
          </>
        }
      />

      <Card variant="outlined">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Tài khoản</TableCell>
                <TableCell sx={headCellSx}>Nhóm quyền</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && grouped.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((g, index) => (
                  <TableRow key={g.accountId} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {g.accountName}
                      </Typography>
                      {g.accountDescription ? (
                        <Typography variant="caption" color="text.secondary">
                          {g.accountDescription}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                        {g.roles.map((role) => (
                          <Tooltip key={role.roleId} title="Gỡ quyền">
                            <Chip
                              label={role.roleName}
                              size="small"
                              color="primary"
                              variant="outlined"
                              onDelete={
                                perms.canDelete
                                  ? () =>
                                      setDeleteTarget({
                                        accountId: g.accountId,
                                        accountName: g.accountName,
                                        roleId: role.roleId,
                                        roleName: role.roleName,
                                      })
                                  : undefined
                              }
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.75} justifyContent="center">
                        {perms.canEdit && (
                          <Tooltip title="Sửa">
                            <IconButton size="medium" color="secondary" onClick={() => openEdit(g)} sx={{ border: 1, borderColor: "secondary.main", borderRadius: 1 }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {perms.canDelete && (
                          <Tooltip title="Xóa">
                            <IconButton size="medium" color="error" onClick={() => setDeleteAccountTarget(g)} sx={{ border: 1, borderColor: "error.main", borderRadius: 1 }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!perms.canEdit && !perms.canDelete && (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={grouped.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
          labelRowsPerPage="Số dòng"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Card>

      {/* Dialog gán quyền */}
      <Dialog open={dialogOpen} onClose={(e, reason) => reason !== "backdropClick" && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#fff",
            bgcolor: editing ? "secondary.main" : "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {editing ? <Edit /> : <Add />}
          {editing ? "Sửa phân quyền tài khoản" : "Gán quyền cho tài khoản"}
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <AutocompleteField
                label="Tài khoản"
                emptyOption="— Chọn tài khoản —"
                disabled={!!editing}
                value={form.accountId}
                onChange={(v) => setForm((f) => ({ ...f, accountId: v }))}
                options={accounts}
                optionValue="id"
                optionLabel="userName"
                optionCaption="id"
                searchFields={["id", "userName", "description"]}
                optionDescription={(a) =>
                  [a?.description, a?.locked ? "Đã khóa" : "Hoạt động"].filter(Boolean).join(" · ")
                }
                dotColor={accountColor}
                showDotInInput
                required
                error={!form.accountId}
                noOptionsText="Không tìm thấy tài khoản"
                popupMinWidth={552}
                startIcon={<Person fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <AutocompleteField
                label="Nhóm quyền"
                placeholder={form.roleIds.length ? "" : "Chọn một hoặc nhiều nhóm quyền..."}
                multiple
                disableCloseOnSelect
                value={form.roleIds}
                onChange={(ids) => setForm((f) => ({ ...f, roleIds: ids }))}
                options={roles}
                optionValue="id"
                optionLabel="name"
                searchFields={["name", "description"]}
                optionDescription={(r) =>
                  [r?.description, r?.isActive === false ? "Đã ngưng" : null].filter(Boolean).join(" · ")
                }
                dotColor={roleColor}
                required
                error={!form.roleIds.length}
                noOptionsText="Không tìm thấy nhóm quyền"
                popupMinWidth={552}
                startIcon={<AdminPanelSettings fontSize="small" />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color={editing ? "secondary" : "primary"} onClick={handleSave} disabled={saving} sx={{ border: 1, borderColor: editing ? "secondary.dark" : "primary.dark" }}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận gỡ */}
      <ConfirmDialog
        open={!!deleteTarget}
        type="delete"
        title="Xác nhận gỡ quyền"
        confirmText="Gỡ"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={
          <Typography variant="body2">
            Gỡ nhóm quyền <strong>{deleteTarget?.roleName}</strong> khỏi tài khoản{" "}
            <strong>{deleteTarget?.accountName}</strong>?
          </Typography>
        }
      />

      {/* Dialog xác nhận xóa toàn bộ quyền của tài khoản */}
      <ConfirmDialog
        open={!!deleteAccountTarget}
        type="delete"
        title="Xác nhận xóa"
        confirmText="Xóa"
        onClose={() => setDeleteAccountTarget(null)}
        onConfirm={handleDeleteAccount}
        message={
          <Typography variant="body2">
            Xóa toàn bộ {deleteAccountTarget?.roles?.length || 0} nhóm quyền của tài khoản{" "}
            <strong>{deleteAccountTarget?.accountName}</strong>?
          </Typography>
        }
      />

      <Backdrop open={refreshing && !loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
