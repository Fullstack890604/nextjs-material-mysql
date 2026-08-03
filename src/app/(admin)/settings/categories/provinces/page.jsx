"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
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
  Map as MapIcon,
  Tag,
  Place,
  Public,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";

const REGIONS = ["Miền Bắc", "Miền Trung", "Tây Nguyên", "Miền Nam"];

const REGION_COLORS = {
  "Miền Bắc": "#1565c0",
  "Miền Trung": "#ed6c02",
  "Tây Nguyên": "#6a1b9a",
  "Miền Nam": "#2e7d32",
};

const emptyForm = {
  code: "",
  name: "",
  region: "",
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

/** Chấm màu nhỏ đứng trước nhãn trong danh sách chọn. */
function Dot({ color }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: color || "#757575",
        mr: 1,
        flexShrink: 0,
      }}
    />
  );
}

export default function ProvincesPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo mã, tên, miền...");
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
      const res = await fetch("/api/provinces");
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
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.region?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  // Về trang đầu khi đổi từ khóa tìm kiếm
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Kẹp lại trang hiện tại khi số dòng giảm (vd sau khi xóa)
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
      region: row.region || "",
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.code.trim()) return notify("Vui lòng nhập mã tỉnh/thành", "warning");
    if (!form.name.trim()) return notify("Vui lòng nhập tên tỉnh/thành", "warning");
    setSaving(true);
    try {
      // Không gửi sortOrder: thêm mới -> server tự lấy số kế tiếp, sửa -> server giữ nguyên.
      const payload = {
        ...form,
        actor: user?.username || null,
      };
      const url = editing ? `/api/provinces/${encodeURIComponent(editing)}` : "/api/provinces";
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
      const res = await fetch(`/api/provinces/${encodeURIComponent(deleteTarget.code)}`, {
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
        title="Danh mục tỉnh / thành phố"
        subtitle="Quản lý danh sách tỉnh / thành phố"
        // icon={<MapIcon />}
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
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Mã</TableCell>
                <TableCell sx={headCellSx}>Tên tỉnh / thành phố</TableCell>
                <TableCell sx={headCellSx}>Miền</TableCell>
                <TableCell sx={headCellSx} align="center">Thứ tự</TableCell>
                <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paged.map((r, index) => (
                  <TableRow key={r.code} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.region || "—"}</TableCell>
                    <TableCell align="center">{r.sortOrder ?? 0}</TableCell>
                    <TableCell align="center">
                      {r.isActive === false ? (
                        <Chip label="Ẩn" size="small" variant="outlined" />
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
          {editing ? "Cập nhật" : "Thêm mới"} tỉnh / thành phố
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Mã" value={form.code} onChange={setField("code")} fullWidth required disabled={!!editing}
                error={!form.code.trim()} helperText={!form.code.trim() ? "Vui lòng nhập mã" : ""}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Tag fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Tên tỉnh / thành phố" value={form.name} onChange={setField("name")} fullWidth required
                error={!form.name.trim()} helperText={!form.name.trim() ? "Vui lòng nhập tên tỉnh / thành phố" : ""}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Place fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Autocomplete
                options={REGIONS}
                value={form.region || null}
                onChange={(e, val) => setForm((f) => ({ ...f, region: val || "" }))}
                noOptionsText="Không tìm thấy"
                renderOption={(props, rg) => {
                  const { key, ...rest } = props;
                  return (
                    <Box component="li" key={rg} {...rest} sx={{ display: "flex", alignItems: "center" }}>
                      <Dot color={REGION_COLORS[rg]} />
                      {rg}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Miền"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              {form.region ? <Dot color={REGION_COLORS[form.region]} /> : <Public fontSize="small" />}
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={setSwitch("isActive")} />} label="Hoạt động" />
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
            Bạn có chắc muốn xóa <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        }
      />

      <Backdrop open={refreshing && !loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
