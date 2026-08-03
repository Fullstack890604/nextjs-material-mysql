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
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
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
  Edit,
  Delete,
  Refresh,
  Person,
  Place,
  Notes,
  CheckBoxOutlineBlank,
  CheckBox as CheckBoxIcon,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/components/PageHeader";
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

const emptyForm = { accountId: "", locationCodes: [], locked: false, notes: "" };

export default function LocationPermissionsPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo tài khoản, địa điểm...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = tạo mới, ngược lại là AccountId
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadLookups = useCallback(async () => {
    try {
      const [as, ls] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/locations").then((r) => r.json()),
      ]);
      if (as.status === "OK") setAccounts(as.data || []);
      if (ls.status === "OK") setLocations(ls.data || []);
    } catch {
      /* im lặng, dropdown sẽ trống */
    }
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sys-location-permissions");
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

  const locationName = useCallback(
    (code) => locations.find((l) => l.locationCode === code)?.locationName || code,
    [locations]
  );

  const codesOf = (listCompany) =>
    (listCompany || "").split(",").map((s) => s.trim()).filter(Boolean);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.accountName?.toLowerCase().includes(q) ||
        r.accountDescription?.toLowerCase().includes(q) ||
        r.listCompany?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, rowsPerPage, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row.accountId);
    setForm({
      accountId: row.accountId,
      locationCodes: codesOf(row.listCompany),
      locked: row.locked === true,
      notes: row.notes || "",
    });
    setDialogOpen(true);
  };

  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.accountId) return notify("Vui lòng chọn tài khoản", "warning");
    if (!form.locationCodes.length) return notify("Vui lòng chọn ít nhất một địa điểm", "warning");
    setSaving(true);
    try {
      const payload = {
        accountId: Number(form.accountId),
        locationCodes: form.locationCodes,
        locked: form.locked,
        notes: form.notes,
        actor: user?.username || null,
      };
      const url = editing
        ? `/api/sys-location-permissions/${encodeURIComponent(editing)}`
        : "/api/sys-location-permissions";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "OK") {
        notify(data.message || (editing ? "Đã cập nhật" : "Đã thêm mới"));
        setDialogOpen(false);
        loadData();
      } else {
        notify(data.message || "Thao tác thất bại", data.severity || "error");
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
        `/api/sys-location-permissions/${encodeURIComponent(deleteTarget.accountId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.status === "OK") {
        notify(data.message || "Đã xóa");
        loadData();
      } else {
        notify(data.message || "Xóa thất bại", data.severity || "error");
      }
    } catch {
      notify("Không thể kết nối máy chủ", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

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
        title="Phân quyền địa điểm"
        subtitle="Gán danh sách địa điểm được truy cập cho từng tài khoản"
        actions={
          <>
            <Button variant="outlined" color="secondary" startIcon={<Refresh />} onClick={loadData} disabled={refreshing} sx={{ width: { xs: "100%", sm: "auto" } }}>
              TRUY VẤN
            </Button>
            {perms.canCreate && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Thêm mới
              </Button>
            )}
          </>
        }
      />

      <Card variant="outlined">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Tài khoản</TableCell>
                <TableCell sx={headCellSx}>Địa điểm</TableCell>
                <TableCell sx={headCellSx} align="center">Khóa</TableCell>
                <TableCell sx={headCellSx}>Ghi chú</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((r, index) => (
                  <TableRow key={r.accountId} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {r.accountName}
                      </Typography>
                      {r.accountDescription ? (
                        <Typography variant="caption" color="text.secondary">
                          {r.accountDescription}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                        {codesOf(r.listCompany).map((code) => (
                          <Chip key={code} label={locationName(code)} size="small" color="primary" variant="outlined" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      {r.locked ? (
                        <Chip label="Đã khóa" size="small" color="error" />
                      ) : (
                        <Chip label="Mở" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{r.notes || "—"}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.75} justifyContent="center">
                        {perms.canEdit && (
                          <Tooltip title="Sửa">
                            <IconButton size="medium" color="secondary" onClick={() => openEdit(r)} sx={{ border: 1, borderColor: "secondary.main", borderRadius: 1 }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {perms.canDelete && (
                          <Tooltip title="Xóa">
                            <IconButton size="medium" color="error" onClick={() => setDeleteTarget(r)} sx={{ border: 1, borderColor: "error.main", borderRadius: 1 }}>
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
          count={filtered.length}
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

      {/* Dialog thêm/sửa */}
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
          {editing ? "Cập nhật" : "Thêm mới"} phân quyền địa điểm
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
                    <Box component="li" key={a.id} {...rest} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#E8F1FF", color: "primary.main" }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {a.id} - {a.userName}
                        </Typography>
                        {a.description ? (
                          <Typography variant="caption" color="text.secondary">
                            {a.description}
                          </Typography>
                        ) : null}
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
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={locations}
                value={locations.filter((l) => form.locationCodes.includes(l.locationCode))}
                onChange={(e, vals) =>
                  setForm((f) => ({ ...f, locationCodes: vals.map((v) => v.locationCode) }))
                }
                isOptionEqualToValue={(o, v) => o.locationCode === v.locationCode}
                getOptionLabel={(l) => `${l.locationCode} - ${l.locationName}`}
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter(
                    (l) =>
                      l.locationCode?.toLowerCase().includes(q) ||
                      l.locationName?.toLowerCase().includes(q) ||
                      l.city?.toLowerCase().includes(q)
                  );
                }}
                renderOption={(props, l, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <Box component="li" key={l.locationCode} {...rest} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlank fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        checked={selected}
                        sx={{ mr: 0.5 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {l.locationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.locationCode}
                          {l.city ? ` · ${l.city}` : ""}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((l, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={l.locationCode} label={l.locationName} size="small" {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Địa điểm"
                    placeholder="Tìm kiếm địa điểm..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <Place fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
                <FormControlLabel
                  control={<Switch checked={form.locked} onChange={setSwitch("locked")} color="error" />}
                  label="Khóa"
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Ghi chú"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                        <Notes fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color={editing ? "secondary" : "primary"} onClick={handleSave} disabled={saving}
            sx={{ border: 1, borderColor: editing ? "secondary.dark" : "primary.dark" }}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <ConfirmDialog
        open={!!deleteTarget}
        type="delete"
        title="Xác nhận xóa"
        confirmText="Xóa"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={
          <Typography variant="body2">
            Xóa phân quyền địa điểm của tài khoản{" "}
            <strong>{deleteTarget?.accountName}</strong>?
          </Typography>
        }
      />

      <Backdrop open={refreshing && !loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
