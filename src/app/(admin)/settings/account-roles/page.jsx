"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Avatar,
  Backdrop,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  InputAdornment,
  ListItemText,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
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

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
              <Autocomplete
                options={accounts}
                disabled={!!editing}
                value={accounts.find((a) => a.id === form.accountId) || null}
                onChange={(e, val) =>
                  setForm((f) => ({ ...f, accountId: val ? val.id : "" }))
                }
                isOptionEqualToValue={(o, v) => o.id === v.id}
                getOptionLabel={(a) => `${a.id} - ${a.userName}`}
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter(
                    (a) =>
                      String(a.id).includes(q) ||
                      a.userName?.toLowerCase().includes(q) ||
                      a.description?.toLowerCase().includes(q)
                  );
                }}
                renderOption={(props, a) => {
                  const { key, ...rest } = props;
                  return (
                    <Box
                      component="li"
                      key={a.id}
                      {...rest}
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1 }}
                    >
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "#E8F1FF", color: "primary.main" }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {a.id} - {a.userName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                          {a.description ? (
                            <Chip
                              label={a.description}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          ) : null}
                          <Typography
                            variant="caption"
                            color={a.locked ? "error.main" : "success.main"}
                          >
                            {a.locked ? "Đã khóa" : "Hoạt động"}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tài khoản"
                    placeholder="Tìm kiếm tài khoản..."
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <Person fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Nhóm quyền" value={form.roleIds} onChange={setField("roleIds")} fullWidth required
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><AdminPanelSettings fontSize="small" /></InputAdornment>) } }}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((id) => {
                        const role = roles.find((r) => r.id === id);
                        return <Chip key={id} label={role ? role.name : id} size="small" />;
                      })}
                    </Box>
                  ),
                }}>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    <Checkbox checked={form.roleIds.includes(r.id)} />
                    <ListItemText primary={r.name} />
                  </MenuItem>
                ))}
              </TextField>
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
