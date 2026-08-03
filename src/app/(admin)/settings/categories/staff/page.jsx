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
  Badge as BadgeIcon,
  Person,
  Work,
  Wc,
  Cake,
  Phone,
  Email,
  Store,
  AccountTree,
  Groups,
  Notes,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import AutocompleteField from "@/components/AutocompleteField";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";

const GENDERS = ["Nam", "Nữ", "Khác"];

/** Màu theo giới tính — đồng bộ với AppointmentFormDialog. */
const GENDER_COLORS = {
  Nam: "info.main",
  Nữ: "#EC407A",
  Khác: "grey.500",
};

/** Màu theo trạng thái của dòng danh mục: đang hoạt động (xanh) / đã ẩn (xám). */
const activeColor = (r) => (r?.isActive === false ? "#9e9e9e" : "#2e7d32");

const emptyForm = {
  code: "",
  fullName: "",
  position: "",
  gender: "Nam",
  dateOfBirth: "",
  phone: "",
  email: "",
  storeCode: "",
  departmentCode: "",
  teamCode: "",
  note: "",
  isActive: true,
};

const headCellSx = {
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
  py: 1.5,
};

const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");
const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
};

export default function StaffPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo mã, tên, chức vụ, phòng ban, SĐT...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/staff");
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

  const loadPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/positions");
      const data = await res.json();
      if (data.status === "OK") setPositions(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadOrgUnits = useCallback(async () => {
    try {
      const [deptRes, teamRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/teams"),
      ]);
      const [deptData, teamData] = await Promise.all([deptRes.json(), teamRes.json()]);
      if (deptData.status === "OK") setDepartments(deptData.data || []);
      if (teamData.status === "OK") setTeams(teamData.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadPositions();
    loadOrgUnits();
    loadData();
  }, [loadCompanies, loadPositions, loadOrgUnits, loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code?.toLowerCase().includes(q) ||
        r.fullName?.toLowerCase().includes(q) ||
        r.position?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.departmentName?.toLowerCase().includes(q) ||
        r.teamName?.toLowerCase().includes(q)
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

  // Tổ, nhóm chỉ hiện những dòng thuộc phòng ban đang chọn
  const teamOptions = useMemo(
    () => (form.departmentCode ? teams.filter((t) => t.departmentCode === form.departmentCode) : []),
    [teams, form.departmentCode]
  );

  // Đổi phòng ban -> bỏ tổ/nhóm cũ nếu nó không thuộc phòng ban mới
  const handleDepartmentChange = (value) =>
    setForm((f) => {
      const keepTeam = teams.some(
        (t) => t.code === f.teamCode && t.departmentCode === value
      );
      return { ...f, departmentCode: value, teamCode: keepTeam ? f.teamCode : "" };
    });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row.code);
    setForm({
      code: row.code || "",
      fullName: row.fullName || "",
      position: row.position || "",
      gender: row.gender || "Nam",
      dateOfBirth: toDateInput(row.dateOfBirth),
      phone: row.phone || "",
      email: row.email || "",
      storeCode: row.storeCode || "",
      departmentCode: row.departmentCode || "",
      teamCode: row.teamCode || "",
      note: row.note || "",
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setDate = (key) => (value) =>
    setForm((f) => ({
      ...f,
      [key]: value && value.isValid() ? value.format("YYYY-MM-DD") : "",
    }));

  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.code.trim()) {
      notify("Vui lòng nhập mã nhân sự", "warning");
      return;
    }
    if (!form.fullName.trim()) {
      notify("Vui lòng nhập họ tên", "warning");
      return;
    }
    if (!form.storeCode) {
      notify("Vui lòng chọn chi nhánh / công ty", "warning");
      return;
    }
    if (!form.position) {
      notify("Vui lòng chọn chức vụ", "warning");
      return;
    }
    if (!form.gender) {
      notify("Vui lòng chọn giới tính", "warning");
      return;
    }
    setSaving(true);
    try {
      // Không gửi sortOrder: thêm mới -> server tự lấy số kế tiếp, sửa -> server giữ nguyên.
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        actor: user?.username || null,
      };
      const url = editing ? `/api/staff/${encodeURIComponent(editing)}` : "/api/staff";
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
      const res = await fetch(`/api/staff/${encodeURIComponent(deleteTarget.code)}`, {
        method: "DELETE",
      });
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

  const positionName = (code) =>
    positions.find((p) => p.code === code)?.name || code || "";

  const positionColor = (name) =>
    name === "Bác sĩ" ? "primary" : name === "Điều dưỡng" ? "secondary" : "default";

  const companyName = (code) =>
    companies.find((c) => c.code === code)?.name || code || "—";

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
      {/* Header */}
      <PageHeader
        title="Quản lý nhân sự"
        subtitle="Bác sĩ, điều dưỡng, trợ thủ của phòng khám"
        // icon={<MedicalServices />}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Refresh />}
              onClick={loadData}
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
          <Table size="small" sx={{ minWidth: 1040 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Mã</TableCell>
                <TableCell sx={headCellSx}>Họ tên</TableCell>
                <TableCell sx={headCellSx} align="center">Chức vụ</TableCell>
                <TableCell sx={headCellSx} align="center">Giới tính</TableCell>
                <TableCell sx={headCellSx}>Điện thoại</TableCell>
                <TableCell sx={headCellSx}>Phòng ban</TableCell>
                <TableCell sx={headCellSx}>Tổ, nhóm</TableCell>
                <TableCell sx={headCellSx}>Chi nhánh / Công ty</TableCell>
                <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
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
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((r, index) => (
                  <TableRow key={r.code} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell align="center">
                      {r.position ? (
                        <Chip label={positionName(r.position)} size="small" color={positionColor(positionName(r.position))} variant="outlined" />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell align="center">{r.gender || "—"}</TableCell>
                    <TableCell>{r.phone || "—"}</TableCell>
                    <TableCell>{r.departmentName || "—"}</TableCell>
                    <TableCell>{r.teamName || "—"}</TableCell>
                    <TableCell>{companyName(r.storeCode)}</TableCell>
                    <TableCell align="center">
                      {r.isActive === false ? (
                        <Chip label="Ngừng" size="small" variant="outlined" />
                      ) : (
                        <Chip label="Đang làm" size="small" color="success" variant="outlined" />
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
          {editing ? "Cập nhật" : "Thêm mới"} nhân sự
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <AutocompleteField
                label="Chi nhánh / Công ty"
                options={companies}
                value={form.storeCode}
                onChange={(v) => setForm((f) => ({ ...f, storeCode: v }))}
                required
                error={!form.storeCode}
                helperText={!form.storeCode ? "Vui lòng chọn chi nhánh / công ty" : ""}
                noOptionsText="Không tìm thấy chi nhánh / công ty"
                dotColor={activeColor}
                showDotInInput
                startIcon={<Store fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Mã nhân sự"
                value={form.code}
                onChange={setField("code")}
                fullWidth
                required
                disabled={!!editing}
                error={!form.code.trim()}
                helperText={!form.code.trim() ? "Vui lòng nhập mã nhân sự" : ""}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Họ tên"
                value={form.fullName}
                onChange={setField("fullName")}
                fullWidth
                required
                error={!form.fullName.trim()}
                helperText={!form.fullName.trim() ? "Vui lòng nhập họ tên" : ""}
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
              <AutocompleteField
                label="Phòng ban"
                options={departments}
                value={form.departmentCode}
                onChange={handleDepartmentChange}
                noOptionsText="Không tìm thấy phòng ban"
                placeholder="Chưa xếp phòng ban"
                dotColor={activeColor}
                showDotInInput
                startIcon={<AccountTree fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField
                label="Tổ, nhóm"
                options={teamOptions}
                value={form.teamCode}
                onChange={(v) => setForm((f) => ({ ...f, teamCode: v }))}
                disabled={!form.departmentCode}
                noOptionsText="Phòng ban này chưa có tổ, nhóm"
                placeholder={form.departmentCode ? "Chưa xếp tổ, nhóm" : "Chọn phòng ban trước"}
                dotColor={activeColor}
                showDotInInput
                startIcon={<Groups fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <AutocompleteField
                label="Chức vụ"
                options={positions}
                value={form.position}
                onChange={(v) => setForm((f) => ({ ...f, position: v }))}
                required
                error={!form.position}
                helperText={!form.position ? "Vui lòng chọn chức vụ" : ""}
                noOptionsText="Không tìm thấy chức vụ"
                dotColor={activeColor}
                showDotInInput
                startIcon={<Work fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <AutocompleteField
                label="Giới tính"
                options={GENDERS}
                value={form.gender}
                onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                required
                error={!form.gender}
                helperText={!form.gender ? "Vui lòng chọn giới tính" : ""}
                noOptionsText="Không tìm thấy"
                dotColor={(g) => GENDER_COLORS[g]}
                showDotInInput
                startIcon={<Wc fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <DatePicker
                  label="Ngày sinh"
                  format="DD/MM/YYYY"
                  value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
                  onChange={setDate("dateOfBirth")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Cake fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Điện thoại"
                value={form.phone}
                onChange={setField("phone")}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Email"
                value={form.email}
                onChange={setField("email")}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
                <FormControlLabel
                  control={<Switch checked={form.isActive} onChange={setSwitch("isActive")} />}
                  label="Đang làm việc"
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Ghi chú"
                value={form.note}
                onChange={setField("note")}
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
            sx={{ border: 1, borderColor: editing ? "secondary.dark" : "primary.dark" }}
          >
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
            Bạn có chắc muốn xóa nhân sự <strong>{deleteTarget?.fullName}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        }
      />

      <Backdrop
        open={refreshing && !loading}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}
      >
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
