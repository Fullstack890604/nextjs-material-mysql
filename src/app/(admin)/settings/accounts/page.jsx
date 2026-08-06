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
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  InputAdornment,
  MenuItem,
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
  Lock,
  Badge,
  Store,
  Business,
  Web,
  ToggleOn,
  Notes,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import { useToast } from "@/context/ToastContext";
import AutocompleteField, { Dot } from "@/components/AutocompleteField";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";

const emptyForm = {
  userName: "",
  password: "",
  description: "",
  employeeCode: "",
  storeCode: "",
  companyCode: "",
  defaultPage: "",
  status: "Active",
  isAdmin: false,
  locked: false,
  notes: "",
};

const headCellSx = {
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
  py: 1.5,
};

/** Màu chấm theo trạng thái của dòng danh mục: đang hoạt động (xanh) / đã ẩn (xám). */
const activeColor = (r) => (r?.isActive === false ? "#9e9e9e" : "#2e7d32");

/** Màu theo trạng thái tài khoản — dùng cho chấm màu ở ô chọn "Trạng thái". */
const STATUS_COLORS = { Active: "#2e7d32", Inactive: "#9e9e9e" };

export default function AccountsPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [staff, setStaff] = useState([]);
  const [locations, setLocations] = useState([]);
  const [menuOptions, setMenuOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo tên đăng nhập, mô tả, mã NV...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = tạo mới
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAccounts = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/accounts");
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

  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.status === "OK") setCompanies(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (data.status === "OK") setStaff(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      if (data.status === "OK") setLocations(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadMenus = useCallback(async () => {
    try {
      const res = await fetch("/api/sys-menus");
      const data = await res.json();
      if (data.status === "OK") {
        setMenuOptions(
          (data.data || []).filter((m) => m.path && m.isActive !== false)
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadStaff();
    loadLocations();
    loadMenus();
    loadAccounts();
  }, [loadCompanies, loadStaff, loadLocations, loadMenus, loadAccounts]);

  const companyName = (code) =>
    companies.find((c) => c.code === code)?.name || code || "—";

  // Mã cửa hàng lấy từ danh mục Địa điểm -> hiện tên cho dễ đọc, giữ mã khi không tra được.
  const storeName = useCallback(
    (code) => locations.find((l) => l.locationCode === code)?.locationName || code || "—",
    [locations]
  );

  // Mã nhân viên -> họ tên trong danh mục Nhân sự ("" nếu không tra được).
  const staffName = useCallback(
    (code) => staff.find((s) => s.code === code)?.fullName || "",
    [staff]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.userName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.employeeCode?.toLowerCase().includes(q) ||
        staffName(r.employeeCode)?.toLowerCase().includes(q) ||
        r.storeCode?.toLowerCase().includes(q) ||
        storeName(r.storeCode)?.toLowerCase().includes(q)
    );
  }, [rows, search, staffName, storeName]);

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
    setEditing(row.userName);
    setForm({
      userName: row.userName || "",
      password: "",
      description: row.description || "",
      employeeCode: row.employeeCode || "",
      storeCode: row.storeCode || "",
      companyCode: row.companyCode || "",
      defaultPage: row.defaultPage || "",
      status: row.status || "Active",
      isAdmin: row.isAdmin === true,
      locked: row.locked === true,
      notes: row.notes || "",
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.userName.trim()) {
      notify("Vui lòng nhập tên đăng nhập", "warning");
      return;
    }
    if (!editing && !form.password) {
      notify("Vui lòng nhập mật khẩu", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, actor: user?.username || null };
      const url = editing
        ? `/api/accounts/${encodeURIComponent(editing)}`
        : "/api/accounts";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "OK") {
        notify(data.message || (editing ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản"));
        setDialogOpen(false);
        loadAccounts();
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
        `/api/accounts/${encodeURIComponent(deleteTarget.userName)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.status === "OK") {
        notify(data.message || "Đã xóa tài khoản");
        loadAccounts();
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
        title="Quản lý tài khoản"
        subtitle="Danh sách người dùng hệ thống"
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Refresh />}
              onClick={loadAccounts}
              disabled={refreshing}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              TRUY VẤN
            </Button>
            {perms.canCreate && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreate}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Thêm mới
              </Button>
            )}
          </>
        }
      />

      <Card variant="outlined">
        {/* Bảng */}
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Tên đăng nhập</TableCell>
                <TableCell sx={headCellSx}>Mô tả</TableCell>
                <TableCell sx={headCellSx}>Nhân viên</TableCell>
                <TableCell sx={headCellSx}>Cửa hàng</TableCell>
                <TableCell sx={headCellSx}>Công ty</TableCell>
                <TableCell sx={headCellSx}>Trang mặc định</TableCell>
                <TableCell sx={headCellSx} align="center">Quyền</TableCell>
                <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
                <TableCell sx={headCellSx} align="center">Khóa</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    Không có tài khoản nào
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((r, index) => (
                  <TableRow key={r.userName} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.userName}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.description || "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.employeeCode ? (
                        <>
                          <Typography variant="body2" fontWeight={600}>
                            {staffName(r.employeeCode) || r.employeeCode}
                          </Typography>
                          {staffName(r.employeeCode) ? (
                            <Typography variant="caption" color="text.secondary">
                              {r.employeeCode}
                            </Typography>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{storeName(r.storeCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{companyName(r.companyCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.defaultPage || "—"}</TableCell>
                    <TableCell align="center">
                      {r.isAdmin ? (
                        <Chip label="Quản trị" size="small" color="primary" />
                      ) : (
                        <Chip label="Nhân viên" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {(r.status || "").toLowerCase() === "inactive" ? (
                        <Chip label="Chưa kích hoạt" size="small" color="warning" variant="outlined" />
                      ) : (
                        <Chip label="Hoạt động" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {r.locked ? (
                        <Chip label="Đã khóa" size="small" color="error" />
                      ) : (
                        <Chip label="Mở" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.75} justifyContent="center">
                        {perms.canEdit && (
                          <Tooltip title="Sửa">
                            <IconButton
                              size="medium"
                              color="secondary"
                              onClick={() => openEdit(r)}
                              sx={{ border: 1, borderColor: "secondary.main", borderRadius: 1 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {perms.canDelete && (
                          <Tooltip title="Xóa">
                            <IconButton
                              size="medium"
                              color="error"
                              onClick={() => setDeleteTarget(r)}
                              sx={{ border: 1, borderColor: "error.main", borderRadius: 1 }}
                            >
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
      <Dialog open={dialogOpen} onClose={(e, reason) => reason !== "backdropClick" && setDialogOpen(false)} maxWidth="md" fullWidth>
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
          {editing ? "Cập nhật" : "Thêm mới"} tài khoản
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <AutocompleteField
                label="Mã công ty"
                emptyOption="— Chọn công ty —"
                value={form.companyCode}
                onChange={(v) => setForm((f) => ({ ...f, companyCode: v }))}
                options={companies}
                optionCaption="code"
                searchFields={["code", "name", "shortName"]}
                optionDescription={(c) =>
                  [c?.code, c?.shortName, c?.address].filter(Boolean).join(" · ")
                }
                dotColor={activeColor}
                showDotInInput
                noOptionsText="Không tìm thấy công ty"
                startIcon={<Business fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Tên đăng nhập"
                value={form.userName}
                onChange={setField("userName")}
                fullWidth
                required
                disabled={!!editing}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={editing ? "Mật khẩu mới" : "Mật khẩu"}
                type="password"
                value={form.password}
                onChange={setField("password")}
                fullWidth
                required={!editing}
                placeholder={editing ? "Để trống nếu không đổi" : ""}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Mô tả / Họ tên"
                value={form.description}
                onChange={setField("description")}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField
                label="Mã nhân viên"
                emptyOption="— Chọn nhân viên —"
                value={form.employeeCode}
                onChange={(v) => setForm((f) => ({ ...f, employeeCode: v }))}
                options={staff}
                optionLabel="fullName"
                optionCaption="code"
                searchFields={["code", "fullName", "position"]}
                optionDescription={(s) =>
                  [s?.code, s?.position, s?.departmentName].filter(Boolean).join(" · ")
                }
                dotColor={activeColor}
                showDotInInput
                noOptionsText="Không tìm thấy nhân viên"
                popupMinWidth={360}
                startIcon={<Badge fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField
                label="Mã cửa hàng"
                emptyOption="— Chọn cửa hàng —"
                value={form.storeCode}
                onChange={(v) => setForm((f) => ({ ...f, storeCode: v }))}
                options={locations}
                optionValue="locationCode"
                optionLabel="locationName"
                optionCaption="locationCode"
                searchFields={["locationCode", "locationName", "city", "region"]}
                optionDescription={(l) =>
                  [l?.locationCode, l?.city, l?.region, l?.address].filter(Boolean).join(" · ")
                }
                dotColor={activeColor}
                showDotInInput
                noOptionsText="Không tìm thấy cửa hàng"
                popupMinWidth={360}
                startIcon={<Store fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField
                label="Trang mặc định"
                freeSolo
                emptyOption="— Chọn trang mặc định —"
                value={form.defaultPage}
                onChange={(v) => setForm((f) => ({ ...f, defaultPage: v }))}
                options={menuOptions}
                optionValue="path"
                optionLabel="path"
                searchFields={["path", "text"]}
                optionDescription="text"
                noOptionsText="Không tìm thấy trang — có thể tự nhập đường dẫn"
                popupMinWidth={360}
                startIcon={<Web fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Trạng thái"
                value={form.status}
                onChange={setField("status")}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <ToggleOn fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                  select: {
                    renderValue: (v) => (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Dot color={STATUS_COLORS[v]} />
                        {v === "Active" ? "Hoạt động" : "Chưa kích hoạt"}
                      </Box>
                    ),
                  },
                }}
              >
                <MenuItem value="Active" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Dot color={STATUS_COLORS.Active} />
                  Hoạt động
                </MenuItem>
                <MenuItem value="Inactive" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Dot color={STATUS_COLORS.Inactive} />
                  Chưa kích hoạt
                </MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ height: "100%" }}>
                <FormControlLabel
                  control={<Switch checked={form.isAdmin} onChange={setSwitch("isAdmin")} />}
                  label="Quản trị"
                />
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
                onChange={setField("notes")}
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
          <Button variant="outlined" color="inherit" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color={editing ? "secondary" : "primary"}
            onClick={handleSave}
            disabled={saving}
            sx={{ minWidth: '110px', border: 1, borderColor: editing ? "secondary.dark" : "primary.dark" }}
          >
            {saving ? "Đang lưu..." : "Lưu lại"}
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
            Bạn có chắc muốn xóa tài khoản {" "}
            <strong>{deleteTarget?.userName}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        }
      />

      <Backdrop
        open={refreshing && !loading}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: "transparent",
        }}
      >
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
