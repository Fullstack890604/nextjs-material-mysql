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
    Place,
    Public,
    LocationCity,
    Home,
    Sell,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import { useToast } from "@/context/ToastContext";
import AutocompleteField from "@/components/AutocompleteField";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";

// Gợi ý sẵn cho 2 ô nhập tự do (vẫn cho gõ giá trị khác nếu cần).
const REGIONS = ["Miền Bắc", "Miền Trung", "Tây Nguyên", "Miền Nam"];
const COUNTRIES = [
    "Việt Nam",
    "Lào",
    "Campuchia",
    "Thái Lan",
    "Singapore",
    "Malaysia",
    "Hàn Quốc",
    "Nhật Bản",
    "Trung Quốc",
    "Hoa Kỳ",
    "Úc",
];

/** Màu theo miền của tỉnh/thành — đồng bộ với trang danh mục Tỉnh/Thành phố. */
const REGION_COLORS = {
    "Miền Bắc": "#1565c0",
    "Miền Trung": "#ed6c02",
    "Tây Nguyên": "#6a1b9a",
    "Miền Nam": "#2e7d32",
};

const emptyForm = {
    locationCode: "",
    locationName: "",
    region: "",
    address: "",
    city: "",
    country: "",
    brand: "",
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

export default function LocationsPage() {
    const { user } = useAuth();
    const perms = usePagePermissions();
    const { notify } = useToast();
    const [rows, setRows] = useState([]);  const [provinces, setProvinces] = useState([]);    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const search = usePageSearch("Tìm theo mã, tên, thành phố, khu vực...");
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
            const res = await fetch("/api/locations");
            const data = await res.json();
            if (data.status === "OK") {
                setRows(data.data || []);
            } else {
                setRows([]);
                if (data.severity === "error")
                    notify(data.message || "Lỗi tải dữ liệu", "error");
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/provinces");
        const data = await res.json();
        if (data.status === "OK") setProvinces(data.data || []);
      } catch {
        /* im lặng, dropdown sẽ trống */
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
        return rows.filter(
            (r) =>
                r.locationCode?.toLowerCase().includes(q) ||
                r.locationName?.toLowerCase().includes(q) ||
                r.city?.toLowerCase().includes(q) ||
                r.region?.toLowerCase().includes(q),
        );
    }, [rows, search]);

    const paged = useMemo(
        () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filtered, page, rowsPerPage],
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
        setEditing(row.locationCode);
        setForm({
            locationCode: row.locationCode || "",
            locationName: row.locationName || "",
            region: row.region || "",
            address: row.address || "",
            city: row.city || "",
            country: row.country || "",
            brand: row.brand || "",
            isActive: row.isActive !== false,
        });
        setDialogOpen(true);
    };

    const setField = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));
    const setSwitch = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.checked }));

    const handleSave = async () => {
        if (!form.locationCode.trim())
            return notify("Vui lòng nhập mã địa điểm", "warning");
        if (!form.locationName.trim())
            return notify("Vui lòng nhập tên địa điểm", "warning");
        setSaving(true);
        try {
            // Không gửi sortOrder: thêm mới -> server tự lấy số kế tiếp, sửa -> server giữ nguyên.
            const payload = {
                ...form,
                actor: user?.username || null,
            };
            const url = editing
                ? `/api/locations/${encodeURIComponent(editing)}`
                : "/api/locations";
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
                `/api/locations/${encodeURIComponent(deleteTarget.locationCode)}`,
                {
                    method: "DELETE",
                },
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
                title="Địa điểm kinh doanh"
                subtitle="Quản lý danh sách địa điểm / phòng khám"
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
                <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 920 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={headCellSx} align="center">
                                    STT
                                </TableCell>
                                <TableCell sx={headCellSx}>Mã</TableCell>
                                <TableCell sx={headCellSx}>Tên địa điểm</TableCell>
                                <TableCell sx={headCellSx}>Khu vực</TableCell>
                                <TableCell sx={headCellSx}>Thành phố</TableCell>
                                <TableCell sx={headCellSx}>Quốc gia</TableCell>
                                <TableCell sx={headCellSx}>Thương hiệu</TableCell>
                                <TableCell sx={headCellSx} align="center">
                                    Thứ tự
                                </TableCell>
                                <TableCell sx={headCellSx} align="center">
                                    Trạng thái
                                </TableCell>
                                <TableCell sx={headCellSx} align="center">
                                    Thao tác
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && filtered.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={10}
                                        align="center"
                                        sx={{ py: 4, color: "text.secondary" }}
                                    >
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading &&
                                paged.map((r, index) => (
                                    <TableRow key={r.locationCode} hover>
                                        <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {r.locationCode}
                                        </TableCell>
                                        <TableCell>{r.locationName}</TableCell>
                                        <TableCell>{r.region || "—"}</TableCell>
                                        <TableCell>{r.city || "—"}</TableCell>
                                        <TableCell>{r.country || "—"}</TableCell>
                                        <TableCell>{r.brand || "—"}</TableCell>
                                        <TableCell align="center">{r.sortOrder ?? 0}</TableCell>
                                        <TableCell align="center">
                                            {r.isActive === false ? (
                                                <Chip label="Ẩn" size="small" variant="outlined" />
                                            ) : (
                                                <Chip
                                                    label="Hoạt động"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="center"
                                            >
                                                {perms.canEdit && (
                                                    <Tooltip title="Sửa">
                                                        <IconButton
                                                            size="small"
                                                            color="secondary"
                                                            onClick={() => openEdit(r)}
                                                            sx={{
                                                                border: 1,
                                                                borderColor: "secondary.main",
                                                                borderRadius: 1,
                                                            }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {perms.canDelete && (
                                                    <Tooltip title="Xóa">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => setDeleteTarget(r)}
                                                            sx={{
                                                                border: 1,
                                                                borderColor: "error.main",
                                                                borderRadius: 1,
                                                            }}
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
            <Dialog
                open={dialogOpen}
                onClose={(e, reason) => reason !== "backdropClick" && setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
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
                    {editing ? "Cập nhật" : "Thêm mới"} địa điểm
                </DialogTitle>
                <DialogCloseButton onClick={() => setDialogOpen(false)} />
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Mã địa điểm"
                                value={form.locationCode}
                                onChange={setField("locationCode")}
                                fullWidth
                                required
                                disabled={!!editing}
                                error={!form.locationCode.trim()}
                                helperText={!form.locationCode.trim() ? "Vui lòng nhập mã địa điểm" : ""}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Tag fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                label="Tên địa điểm"
                                value={form.locationName}
                                onChange={setField("locationName")}
                                fullWidth
                                required
                                error={!form.locationName.trim()}
                                helperText={!form.locationName.trim() ? "Vui lòng nhập tên địa điểm" : ""}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Place fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Địa chỉ"
                                value={form.address}
                                onChange={setField("address")}
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Home fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AutocompleteField
                                label="Khu vực"
                                freeSolo
                                options={REGIONS}
                                value={form.region}
                                onChange={(val) => setForm((f) => ({ ...f, region: val }))}
                                dotColor={(rg) => REGION_COLORS[rg]}
                                startIcon={<Public fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AutocompleteField
                                label="Thành phố"
                                placeholder="Tìm kiếm tỉnh/thành..."
                                options={provinces}
                                optionValue="name"
                                value={form.city}
                                onChange={(val) => setForm((f) => ({ ...f, city: val }))}
                                searchFields={["code", "name", "region"]}
                                dotColor={(p) => REGION_COLORS[p?.region]}
                                showDotInInput
                                startIcon={<LocationCity fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AutocompleteField
                                label="Quốc gia"
                                freeSolo
                                options={COUNTRIES}
                                value={form.country}
                                onChange={(val) => setForm((f) => ({ ...f, country: val }))}
                                dotColor="#757575"
                                startIcon={<Public fontSize="small" />}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Thương hiệu"
                                value={form.brand}
                                onChange={setField("brand")}
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Sell fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Stack
                                direction="row"
                                alignItems="center"
                                sx={{ height: "100%" }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.isActive}
                                            onChange={setSwitch("isActive")}
                                        />
                                    }
                                    label="Hoạt động"
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDialogOpen(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color={editing ? "secondary" : "primary"}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                            border: 1,
                            borderColor: editing ? "secondary.dark" : "primary.dark",
                        }}
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
                        Bạn có chắc muốn xóa địa điểm <strong>{deleteTarget?.locationName}</strong>? Hành động này không thể hoàn tác.
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
