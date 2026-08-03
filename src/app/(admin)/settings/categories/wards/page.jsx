"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
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
  Apartment,
  Tag,
  Place,
  Map as MapIcon,
  Domain,
  AddCircleOutline,
  RemoveCircleOutline,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";

/** Màu theo miền của tỉnh/thành — đồng bộ với trang danh mục Tỉnh/Thành phố. */
const REGION_COLORS = {
  "Miền Bắc": "#1565c0",
  "Miền Trung": "#ed6c02",
  "Tây Nguyên": "#6a1b9a",
  "Miền Nam": "#2e7d32",
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

const emptyForm = {
  code: "",
  name: "",
  provinceCode: "",
  district: "",
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

export default function WardsPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo mã, tên, quận/huyện...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (key) =>
    setOpenGroups((m) => ({ ...m, [key]: !m[key] }));

  const provinceName = useCallback(
    (code) => provinces.find((p) => p.code === code)?.name || code || "—",
    [provinces]
  );

  // Tỉnh/thành đang chọn trong dialog — dùng cho value của Autocomplete và chấm màu ở ô đã chọn.
  const selectedProvince = useMemo(
    () => provinces.find((p) => p.code === form.provinceCode) || null,
    [provinces, form.provinceCode]
  );

  const loadProvinces = useCallback(async () => {
    try {
      const res = await fetch("/api/provinces");
      const data = await res.json();
      if (data.status === "OK") setProvinces(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/wards");
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
    loadProvinces();
    loadData();
  }, [loadProvinces, loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.district?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Nhóm theo Tỉnh/Thành
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.provinceCode || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Phân trang theo nhóm tỉnh/thành
  const pagedGroups = useMemo(
    () => groups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [groups, page, rowsPerPage]
  );

  // Về trang đầu khi đổi từ khóa tìm kiếm
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Kẹp lại trang hiện tại khi số nhóm giảm (vd sau khi xóa)
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(groups.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [groups.length, rowsPerPage, page]);

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
      provinceCode: row.provinceCode || "",
      district: row.district || "",
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.provinceCode) return notify("Vui lòng chọn tỉnh / thành phố", "warning");
    if (!form.code.trim()) return notify("Vui lòng nhập mã phường/xã", "warning");
    if (!form.name.trim()) return notify("Vui lòng nhập tên phường/xã", "warning");
    setSaving(true);
    try {
      // Không gửi sortOrder: thêm mới -> server tự lấy số kế tiếp, sửa -> server giữ nguyên.
      const payload = {
        ...form,
        actor: user?.username || null,
      };
      const url = editing ? `/api/wards/${encodeURIComponent(editing)}` : "/api/wards";
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
      const res = await fetch(`/api/wards/${encodeURIComponent(deleteTarget.code)}`, {
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
        title="Danh mục phường / xã"
        subtitle="Quản lý danh sách phường / xã"
        // icon={<Apartment />}
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
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headCellSx, width: 48 }} />
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Mã</TableCell>
                <TableCell sx={headCellSx}>Tên phường / xã</TableCell>
                <TableCell sx={headCellSx}>Quận / Huyện</TableCell>
                <TableCell sx={headCellSx} align="center">Thứ tự</TableCell>
                <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                pagedGroups.map(([code, wards]) => {
                  const open = openGroups[code] === true;
                  return (
                    <Fragment key={code || "none"}>
                      {/* Dòng nhóm Tỉnh/Thành */}
                      <TableRow
                        hover
                        onClick={() => toggleGroup(code)}
                        sx={{ cursor: "pointer", bgcolor: "grey.100" }}
                      >
                        <TableCell>
                          <IconButton
                            size="medium"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(code);
                            }}
                          >
                            {open ? (
                              <RemoveCircleOutline fontSize="small" />
                            ) : (
                              <AddCircleOutline fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell colSpan={7} sx={{ fontWeight: 700 }}>
                          {provinceName(code)}
                          <Chip
                            label={wards.length}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Các phường/xã trong nhóm */}
                      {open &&
                        wards.map((r, i) => (
                          <TableRow key={r.code} hover>
                            <TableCell />
                            <TableCell align="center">{i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.district || "—"}</TableCell>
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
                    </Fragment>
                  );
                })}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={groups.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
          labelRowsPerPage="Số tỉnh/thành"
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
          {editing ? "Cập nhật" : "Thêm mới"} phường / xã
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={provinces}
                value={selectedProvince}
                onChange={(e, val) => setForm((f) => ({ ...f, provinceCode: val ? val.code : "" }))}
                isOptionEqualToValue={(o, v) => o.code === v.code}
                getOptionLabel={(p) => p.name || ""}
                noOptionsText="Không tìm thấy tỉnh / thành phố"
                renderOption={(props, p) => {
                  const { key, ...rest } = props;
                  return (
                    <Box component="li" key={p.code} {...rest} sx={{ display: "flex", alignItems: "center" }}>
                      <Dot color={REGION_COLORS[p.region]} />
                      {p.name}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tỉnh / Thành phố"
                    required
                    error={!form.provinceCode}
                    helperText={!form.provinceCode ? "Vui lòng chọn tỉnh / thành phố" : ""}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              {selectedProvince ? (
                                <Dot color={REGION_COLORS[selectedProvince.region]} />
                              ) : (
                                <MapIcon fontSize="small" />
                              )}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Quận / Huyện" value={form.district} onChange={setField("district")} fullWidth
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Domain fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Mã" value={form.code} onChange={setField("code")} fullWidth required disabled={!!editing}
                error={!form.code.trim()} helperText={!form.code.trim() ? "Vui lòng nhập mã phường / xã" : ""}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Tag fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Tên phường / xã" value={form.name} onChange={setField("name")} fullWidth required
                error={!form.name.trim()} helperText={!form.name.trim() ? "Vui lòng nhập tên phường / xã" : ""}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Place fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
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
