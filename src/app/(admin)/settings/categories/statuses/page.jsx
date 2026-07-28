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
  Flag,
  Notes,
  Category,
  Palette,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import AutocompleteField, { Dot } from "@/components/AutocompleteField";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";

const emptyForm = {
  groupCode: "",
  code: "",
  name: "",
  description: "",
  color: "",
  isFinal: false,
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

// Bảng màu gợi ý cho Chip trạng thái — giá trị là token của theme (src/palette.js)
// nên đổi theme là màu tự đổi theo, không cần sửa dữ liệu.
const COLOR_OPTIONS = [
  { code: "success.main", name: "Xanh lá — hoàn tất, thành công" },
  { code: "primary.main", name: "Xanh dương — đang xử lý" },
  { code: "info.main", name: "Xanh nhạt — mới, thông tin" },
  { code: "warning.main", name: "Cam — chờ, cảnh báo" },
  { code: "error.main", name: "Đỏ — hủy, lỗi" },
  { code: "secondary.main", name: "Tím — phụ" },
  { code: "grey.600", name: "Xám — ngưng sử dụng" },
];

/** Màu mặc định khi bản ghi chưa chọn màu. */
const colorOf = (row) => row?.color || "grey.500";

export default function StatusesPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo mã, tên, loại trạng thái...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Lọc theo loại trạng thái (đơn hàng / kho vận / ...)
  const [groupFilter, setGroupFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [sRes, gRes] = await Promise.all([
        fetch("/api/statuses").then((r) => r.json()),
        fetch("/api/status-groups").then((r) => r.json()),
      ]);
      if (sRes.status === "OK") {
        setRows(sRes.data || []);
      } else {
        setRows([]);
        if (sRes.severity === "error") notify(sRes.message || "Lỗi tải dữ liệu", "error");
      }
      setGroups(gRes.status === "OK" ? gRes.data || [] : []);
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
    return rows.filter((r) => {
      if (groupFilter && r.groupCode !== groupFilter) return false;
      if (!q) return true;
      return (
        r.code?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.groupName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, groupFilter]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  useEffect(() => {
    setPage(0);
  }, [search, groupFilter]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, rowsPerPage, page]);

  const openCreate = () => {
    setEditing(null);
    // Đang lọc theo loại nào thì mặc định thêm mới vào chính loại đó.
    setForm({ ...emptyForm, groupCode: groupFilter || "" });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row.id);
    setForm({
      groupCode: row.groupCode || "",
      code: row.code || "",
      name: row.name || "",
      description: row.description || "",
      color: row.color || "",
      isFinal: row.isFinal === true,
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const handleSave = async () => {
    if (!form.groupCode) return notify("Vui lòng chọn loại trạng thái", "warning");
    if (!form.code.trim()) return notify("Vui lòng nhập mã trạng thái", "warning");
    if (!form.name.trim()) return notify("Vui lòng nhập tên trạng thái", "warning");
    setSaving(true);
    try {
      // Không gửi sortOrder: thêm mới -> server tự lấy số kế tiếp trong loại,
      // sửa -> server giữ nguyên (hoặc xếp cuối nếu đổi sang loại khác).
      const payload = { ...form, actor: user?.username || null };
      const url = editing ? `/api/statuses/${encodeURIComponent(editing)}` : "/api/statuses";
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
      const res = await fetch(`/api/statuses/${encodeURIComponent(deleteTarget.id)}`, {
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
        title="Danh mục trạng thái"
        subtitle="Quản lý trạng thái dùng cho đơn hàng, kho vận và các nghiệp vụ khác"
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
        <Stack direction="row" spacing={1} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <AutocompleteField
            size="small"
            label="Loại trạng thái"
            placeholder="Tất cả loại"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups}
            optionCaption="code"
            searchFields={["code", "name", "description"]}
            startIcon={<Category fontSize="small" />}
            fullWidth={false}
            sx={{ maxWidth: 360, width: "100%" }}
          />
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} align="center">STT</TableCell>
                <TableCell sx={headCellSx}>Loại</TableCell>
                <TableCell sx={headCellSx}>Mã</TableCell>
                <TableCell sx={headCellSx}>Tên trạng thái</TableCell>
                <TableCell sx={headCellSx}>Mô tả</TableCell>
                <TableCell sx={headCellSx} align="center">Kết thúc</TableCell>
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
                  <TableRow key={r.id} hover>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{r.groupName || r.groupCode}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.name}
                        size="small"
                        variant="outlined"
                        icon={<Box sx={{ display: "flex", pl: 0.75 }}><Dot color={colorOf(r)} /></Box>}
                        sx={{ borderColor: colorOf(r), color: colorOf(r), fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{r.description || "—"}</TableCell>
                    <TableCell align="center">
                      {r.isFinal ? (
                        <Chip label="Kết thúc" size="small" color="default" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{r.sortOrder ?? 0}</TableCell>
                    <TableCell align="center">
                      {r.isActive === false ? (
                        <Chip label="Ẩn" size="small" variant="outlined" />
                      ) : (
                        <Chip label="Hoạt động" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {perms.canEdit && (
                          <Tooltip title="Sửa">
                            <IconButton size="small" color="secondary" onClick={() => openEdit(r)} sx={{ border: 1, borderColor: "secondary.main", borderRadius: 1 }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {perms.canDelete && (
                          <Tooltip title="Xóa">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(r)} sx={{ border: 1, borderColor: "error.main", borderRadius: 1 }}>
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
          {editing ? "Cập nhật" : "Thêm mới"} trạng thái
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <AutocompleteField
                label="Loại trạng thái"
                value={form.groupCode}
                onChange={(v) => setForm((f) => ({ ...f, groupCode: v }))}
                options={groups}
                optionCaption="code"
                searchFields={["code", "name", "description"]}
                required
                error={!form.groupCode}
                helperText={!form.groupCode ? "Vui lòng chọn loại trạng thái" : ""}
                startIcon={<Category fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Mã" value={form.code} onChange={setField("code")} fullWidth required
                error={!form.code.trim()} helperText={!form.code.trim() ? "Vui lòng nhập mã" : ""}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Tag fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Tên trạng thái" value={form.name} onChange={setField("name")} fullWidth required
                error={!form.name.trim()} helperText={!form.name.trim() ? "Vui lòng nhập tên trạng thái" : ""}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Flag fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <AutocompleteField
                label="Màu hiển thị"
                placeholder="Mặc định (xám)"
                value={form.color}
                onChange={(v) => setForm((f) => ({ ...f, color: v }))}
                options={COLOR_OPTIONS}
                dotColor={(o) => o?.code}
                showDotInInput
                startIcon={<Palette fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Mô tả" value={form.description} onChange={setField("description")} fullWidth multiline minRows={2}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}><Notes fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
                <Tooltip title="Đánh dấu đây là trạng thái kết thúc quy trình (đã giao, đã hủy...)">
                  <FormControlLabel control={<Switch checked={form.isFinal} onChange={setSwitch("isFinal")} />} label="Trạng thái kết thúc" />
                </Tooltip>
              </Stack>
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
            Bạn có chắc muốn xóa trạng thái <strong>{deleteTarget?.name}</strong> thuộc loại{" "}
            <strong>{deleteTarget?.groupName}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        }
      />

      <Backdrop open={refreshing && !loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
}
