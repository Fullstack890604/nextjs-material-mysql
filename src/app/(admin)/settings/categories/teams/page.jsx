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
  Tag,
  Groups,
  AccountTree,
  Badge as BadgeIcon,
  Notes,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import AutocompleteField from "@/components/AutocompleteField";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import NumberField from "@/components/NumberField";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";
import { formatNumber } from "@/lib/numberFormat";

const emptyForm = {
  code: "",
  name: "",
  departmentCode: "",
  description: "",
  leaderCode: "",
  headCount: "",
  isActive: true,
};

const qty = (v) => formatNumber(v, { type: "quantity" });

const headCellSx = {
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
  py: 1.5,
};

const totalCellSx = { fontWeight: 700, bgcolor: "grey.100", whiteSpace: "nowrap" };

export default function TeamsPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo mã, tên, phòng ban, tổ trưởng...");
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
      const res = await fetch("/api/teams");
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

  // Danh mục phụ cho ô chọn trong form (phòng ban, tổ trưởng) — tải một lần
  const loadLookups = useCallback(async () => {
    try {
      const [deptRes, staffRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/staff"),
      ]);
      const [deptData, staffData] = await Promise.all([deptRes.json(), staffRes.json()]);
      setDepartments(deptData.status === "OK" ? deptData.data || [] : []);
      setStaff(staffData.status === "OK" ? staffData.data || [] : []);
    } catch {
      // Không chặn trang khi danh mục phụ lỗi — ô chọn sẽ rỗng
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.departmentCode?.toLowerCase().includes(q) ||
        r.departmentName?.toLowerCase().includes(q) ||
        r.leaderName?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  // Tổng cộng tính trên toàn bộ dữ liệu đã lọc (không phải chỉ trang hiện tại)
  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          acc.count += 1;
          acc.headCount += Number(r.headCount) || 0;
          if (r.isActive !== false) acc.active += 1;
          return acc;
        },
        { count: 0, headCount: 0, active: 0 }
      ),
    [filtered]
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
    setEditing(row.code);
    setForm({
      code: row.code || "",
      name: row.name || "",
      departmentCode: row.departmentCode || "",
      description: row.description || "",
      leaderCode: row.leaderCode || "",
      headCount: row.headCount ?? "",
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.code.trim()) return notify("Vui lòng nhập mã tổ, nhóm", "warning");
    if (!form.name.trim()) return notify("Vui lòng nhập tên tổ, nhóm", "warning");
    if (!form.departmentCode) return notify("Vui lòng chọn phòng ban", "warning");
    setSaving(true);
    try {
      // Không gửi sortOrder: thêm mới -> server tự lấy số kế tiếp, sửa -> server giữ nguyên.
      const payload = {
        ...form,
        actor: user?.username || null,
      };
      const url = editing ? `/api/teams/${encodeURIComponent(editing)}` : "/api/teams";
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
      const res = await fetch(`/api/teams/${encodeURIComponent(deleteTarget.code)}`, {
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
        title="Danh mục tổ, nhóm"
        subtitle="Quản lý tổ, nhóm trực thuộc từng phòng ban"
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
          <Table size="small" sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Mã</TableCell>
                <TableCell sx={headCellSx}>Tên tổ, nhóm</TableCell>
                <TableCell sx={headCellSx}>Phòng ban</TableCell>
                <TableCell sx={headCellSx}>Tổ trưởng</TableCell>
                <TableCell sx={headCellSx} align="right">Định biên</TableCell>
                <TableCell sx={headCellSx} align="center">Thứ tự</TableCell>
                <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((r, index) => (
                  <TableRow key={r.code} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
                    <TableCell>
                      {r.name}
                      {r.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {r.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{r.departmentName || r.departmentCode || "—"}</TableCell>
                    <TableCell>{r.leaderName || "—"}</TableCell>
                    <TableCell align="right">{qty(r.headCount)}</TableCell>
                    <TableCell align="center">{r.sortOrder ?? 0}</TableCell>
                    <TableCell align="center">
                      {r.isActive === false ? (
                        <Chip label="Ngừng" size="small" variant="outlined" />
                      ) : (
                        <Chip label="Hoạt động" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
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

              {/* Tổng cộng — tính trên toàn bộ dữ liệu đã lọc, không đổi khi chuyển trang */}
              {!loading && filtered.length > 0 && (
                <TableRow>
                  <TableCell sx={totalCellSx} colSpan={5}>
                    TỔNG CỘNG{" "}
                    <Typography variant="caption" color="text.secondary">
                      ({qty(totals.count)} tổ/nhóm, {qty(totals.active)} đang hoạt động)
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...totalCellSx, color: "secondary.main" }} align="right">
                    {qty(totals.headCount)}
                  </TableCell>
                  <TableCell sx={{ bgcolor: "grey.100" }} />
                  <TableCell sx={{ bgcolor: "grey.100" }} />
                  <TableCell sx={{ bgcolor: "grey.100" }} />
                </TableRow>
              )}
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
          {editing ? "Cập nhật" : "Thêm mới"} tổ, nhóm
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Mã" value={form.code} onChange={setField("code")} fullWidth required disabled={!!editing}
                error={!form.code.trim()}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Tag fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Tên tổ, nhóm" value={form.name} onChange={setField("name")} fullWidth required
                error={!form.name.trim()}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Groups fontSize="small" /></InputAdornment>) } }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 5 }}>
              <AutocompleteField label="Phòng ban" value={form.departmentCode}
                onChange={(v) => setForm((f) => ({ ...f, departmentCode: v }))}
                options={departments} optionCaption="code" required emptyOption="— Chọn phòng ban —"
                optionDescription={(d) =>
                  [d?.locationName, d?.managerName ? `TP: ${d.managerName}` : null, d?.description]
                    .filter(Boolean)
                    .join(" · ")
                }
                error={!form.departmentCode}
                popupMinWidth={360}
                startIcon={<AccountTree fontSize="small" />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <AutocompleteField label="Tổ trưởng" value={form.leaderCode}
                onChange={(v) => setForm((f) => ({ ...f, leaderCode: v }))}
                options={staff} optionLabel="fullName" emptyOption="— Chọn tổ trưởng —"
                optionDescription={(s) =>
                  [s?.code, s?.position, s?.departmentName].filter(Boolean).join(" · ")
                }
                popupMinWidth={360}
                startIcon={<BadgeIcon fontSize="small" />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <NumberField label="Định biên" value={form.headCount} decimalScale={0}
                onChange={(v) => setForm((f) => ({ ...f, headCount: v }))}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Groups fontSize="small" /></InputAdornment>) } }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField label="Mô tả" value={form.description} onChange={setField("description")} fullWidth multiline minRows={2}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}><Notes fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
                <FormControlLabel control={<Switch checked={form.isActive} onChange={setSwitch("isActive")} />} label="Hoạt động" />
              </Stack>
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
            Bạn có chắc muốn xóa tổ, nhóm <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        }
      />

      <Backdrop open={refreshing && !loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
