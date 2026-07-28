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
  Divider,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  InputAdornment,
  Popover,
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
  Search,
  Edit,
  Delete,
  Refresh,
  AccountTree,
  Tag,
  Link as LinkIcon,
  FormatListNumbered,
  Segment,
  ExpandMore,
  ChevronRight,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePagePermissions } from "@/context/MenuContext";
import { usePageSearch } from "@/context/SearchContext";
import { useToast } from "@/context/ToastContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";
import PageHeader from "@/components/PageHeader";
import { resolveIcon, iconNames, DefaultIcon } from "@/components/MenuIcons";
import { palette } from "@/palette";

// Màu icon để trống -> dùng màu chủ đạo của theme (src/palette.js)
const DEFAULT_ICON_COLOR = "primary.main";

/** Bảng màu lấy thẳng từ theme, lưu dạng token ("primary.main") để đổi palette là menu đổi theo. */
const PALETTE_SWATCHES = Object.entries(palette).flatMap(([group, shades]) =>
  ["main", "light", "dark"].map((shade) => ({
    token: `${group}.${shade}`,
    value: shades[shade],
  }))
);

/** Token theme ("primary.main") hoặc mã hex -> mã hex, để vẽ ô màu và đổ vào input type="color". */
const toHex = (color) => {
  if (!color) return palette.primary.main;
  if (color.startsWith("#")) return color;
  const [group, shade] = color.split(".");
  return palette[group]?.[shade] || palette.primary.main;
};

const emptyForm = {
  parentId: 0,
  text: "",
  name: "",
  path: "",
  icon: "",
  iconColor: "",
  sortOrder: 100,
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

// Dựng cây menu từ danh sách phẳng (Id/ParentId)
const buildMenuTree = (list) => {
  const byId = new Map();
  list.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots = [];
  list.forEach((r) => {
    const node = byId.get(r.id);
    const parent = r.parentId ? byId.get(r.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortRec = (arr) => {
    arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
};

export default function MenusPage() {
  const { user } = useAuth();
  const perms = usePagePermissions();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const search = usePageSearch("Tìm theo tên, path, icon...");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMap, setOpenMap] = useState({});

  const toggleNode = (id) =>
    setOpenMap((m) => ({ ...m, [id]: !m[id] }));

  // Chọn icon dạng lưới
  const [iconAnchor, setIconAnchor] = useState(null);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [iconSearch, setIconSearch] = useState("");
  const filteredIcons = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    return q ? iconNames.filter((n) => n.toLowerCase().includes(q)) : iconNames;
  }, [iconSearch]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sys-menus");
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
        r.text?.toLowerCase().includes(q) ||
        r.path?.toLowerCase().includes(q) ||
        r.icon?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Danh sách menu cha dạng cây (thụt lề theo cấp, loại trừ chính nó & menu con của nó).
  // Phần tử đầu là mục "Gốc" (parentId = 0) để chọn menu cấp cao nhất.
  const parentTreeOptions = useMemo(() => {
    const roots = buildMenuTree(rows);
    const out = [{ id: 0, text: "Gốc (menu cấp 1)", depth: 0, isRoot: true }];
    const walk = (nodes, depth) => {
      nodes.forEach((n) => {
        if (n.id === editing) return; // bỏ qua chính nó và toàn bộ nhánh con
        out.push({
          id: n.id,
          text: n.text,
          path: n.path,
          icon: n.icon,
          childCount: n.children?.length || 0,
          depth,
        });
        if (n.children?.length) walk(n.children, depth + 1);
      });
    };
    walk(roots, 0);
    return out;
  }, [rows, editing]);

  const selectedParent = useMemo(
    () => parentTreeOptions.find((p) => p.id === (Number(form.parentId) || 0)) || null,
    [parentTreeOptions, form.parentId]
  );

  /** Số thứ tự kế tiếp trong CÙNG một menu cha (max + 1) — thứ tự chỉ có ý nghĩa giữa các menu cùng cấp. */
  const nextSortOrder = useCallback(
    (parentId) =>
      rows
        .filter((r) => (r.parentId ?? 0) === (Number(parentId) || 0))
        .reduce((max, r) => Math.max(max, r.sortOrder ?? 0), 0) + 1,
    [rows]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: nextSortOrder(0) });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row.id);
    setForm({
      parentId: row.parentId ?? 0,
      text: row.text || "",
      name: row.name || "",
      path: row.path || "",
      icon: row.icon || "",
      iconColor: row.iconColor || "",
      sortOrder: row.sortOrder ?? 100,
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSwitch = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  // Đổi menu cha -> tự điền thứ tự kế tiếp của cha mới (vẫn sửa tay được nếu muốn chèn giữa).
  const handleParentChange = (option) => {
    const parentId = Number(option?.id) || 0;
    setForm((f) =>
      parentId === (Number(f.parentId) || 0)
        ? { ...f, parentId }
        : { ...f, parentId, sortOrder: nextSortOrder(parentId) }
    );
  };

  const handleSave = async () => {
    if (!form.text.trim()) return notify("Vui lòng nhập tên menu (Text)", "warning");
    setSaving(true);
    try {
      const payload = {
        ...form,
        parentId: Number(form.parentId) || 0,
        sortOrder: Number(form.sortOrder) || 0,
        actor: user?.username || null,
      };
      const url = editing ? `/api/sys-menus/${editing}` : "/api/sys-menus";
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
      const res = await fetch(`/api/sys-menus/${deleteTarget.id}`, { method: "DELETE" });
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

  const tree = useMemo(() => buildMenuTree(rows), [rows]);
  const isSearching = search.trim() !== "";

  const visibleRows = useMemo(() => {
    if (isSearching) {
      return filtered.map((row) => ({ row, depth: 0 }));
    }

    const out = [];
    const walk = (nodes, depth) => {
      nodes.forEach((node) => {
        out.push({ row: node, depth });
        if (node.children?.length && openMap[node.id] === true) {
          walk(node.children, depth + 1);
        }
      });
    };

    walk(tree, 0);
    return out;
  }, [filtered, isSearching, openMap, tree]);

  const pagedRows = useMemo(
    () => visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [visibleRows, page, rowsPerPage]
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(visibleRows.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [visibleRows.length, rowsPerPage, page]);

  const renderRow = (n, depth) => {
    const hasChildren = (n.children?.length || 0) > 0;
    const open = openMap[n.id] === true;
    const RowIcon = resolveIcon(n.icon);
    return (
      <TableRow key={n.id} hover>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", pl: depth * 3 }}>
            {hasChildren ? (
              <IconButton size="small" onClick={() => toggleNode(n.id)} sx={{ mr: 0.5 }}>
                {open ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
              </IconButton>
            ) : (
              <Box sx={{ width: 30 }} />
            )}
            <RowIcon fontSize="small" sx={{ color: n.iconColor || DEFAULT_ICON_COLOR, mr: 1 }} />
            <Typography variant="body2" fontWeight={hasChildren ? 700 : 500}>
              {n.text}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ color: "text.secondary" }}>{n.path || "—"}</TableCell>
        <TableCell align="center">{n.sortOrder ?? 0}</TableCell>
        <TableCell align="center">
          {n.isActive === false ? (
            <Chip label="Ẩn" size="small" variant="outlined" />
          ) : (
            <Chip label="Hiện" size="small" color="success" variant="outlined" />
          )}
        </TableCell>
        <TableCell align="center">
          <Stack direction="row" spacing={0.5} justifyContent="center">
            {perms.canEdit && (
              <Tooltip title="Sửa">
                <IconButton size="small" color="secondary" onClick={() => openEdit(n)} sx={{ border: 1, borderColor: "secondary.main", borderRadius: 1 }}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {perms.canDelete && (
              <Tooltip title="Xóa">
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(n)} sx={{ border: 1, borderColor: "error.main", borderRadius: 1 }}>
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
    );
  };

  const PreviewIcon = resolveIcon(form.icon);

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
        title="Quản lý menu"
        subtitle="Danh sách menu hệ thống (SysMenus)"
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
          <Table size="small" sx={{ minWidth: 940 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Tên menu (Text)</TableCell>
                <TableCell sx={headCellSx}>Path</TableCell>
                <TableCell sx={headCellSx} align="center">Thứ tự</TableCell>
                <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
                <TableCell sx={headCellSx} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                visibleRows.length > 0 &&
                pagedRows.map(({ row, depth }) => renderRow(row, depth))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={visibleRows.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[50, 100, 500, 1000]}
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
          {editing ? "Cập nhật" : "Thêm mới"} menu
        </DialogTitle>
        <DialogCloseButton onClick={() => setDialogOpen(false)} />
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={parentTreeOptions}
                value={selectedParent}
                onChange={(e, val) => handleParentChange(val)}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                getOptionLabel={(p) => p.text || ""}
                disableClearable
                noOptionsText="Không tìm thấy menu"
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter(
                    (p) =>
                      p.text?.toLowerCase().includes(q) || p.path?.toLowerCase().includes(q)
                  );
                }}
                renderOption={(props, p) => {
                  const { key, ...rest } = props;
                  const OptIcon = p.isRoot ? AccountTree : resolveIcon(p.icon);
                  return (
                    <Box
                      component="li"
                      key={p.id}
                      {...rest}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        // Thụt lề theo cấp để thấy rõ vị trí trong cây menu
                        pl: `${16 + p.depth * 20}px !important`,
                      }}
                    >
                      <OptIcon
                        fontSize="small"
                        sx={{ color: p.isRoot ? "text.disabled" : "primary.main" }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={p.childCount ? 700 : 500} noWrap>
                          {p.text}
                        </Typography>
                        {p.path && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                            /{p.path}
                          </Typography>
                        )}
                      </Box>
                      {p.childCount > 0 && (
                        <Chip label={p.childCount} size="small" variant="outlined" sx={{ height: 18, fontSize: 11 }} />
                      )}
                    </Box>
                  );
                }}
                renderInput={(params) => {
                  const ValueIcon =
                    !selectedParent || selectedParent.isRoot
                      ? AccountTree
                      : resolveIcon(selectedParent.icon);
                  return (
                    <TextField
                      {...params}
                      label="Menu cha"
                      placeholder="Tìm theo tên hoặc path..."
                      helperText={
                        !selectedParent
                          ? ""
                          : selectedParent.isRoot
                            ? "Menu hiển thị ở cấp ngoài cùng của sidebar"
                            : `Menu con của: ${selectedParent.text}`
                      }
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <ValueIcon
                                  fontSize="small"
                                  sx={{
                                    color: selectedParent?.isRoot ? "text.disabled" : "primary.main",
                                  }}
                                />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  );
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Tên menu (Text)" value={form.text} onChange={setField("text")} fullWidth required
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Segment fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Path" value={form.path} onChange={setField("path")} fullWidth placeholder="vd: settings/menus"
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><LinkIcon fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Name (mã định danh)" value={form.name} onChange={setField("name")} fullWidth
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><Tag fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Icon (tên MUI)"
                value={form.icon || ""}
                placeholder="Nhấn để chọn icon..."
                fullWidth
                onClick={(e) => setIconAnchor(e.currentTarget)}
                slotProps={{
                  input: {
                    readOnly: true,
                    sx: { cursor: "pointer" },
                    startAdornment: (
                      <InputAdornment position="start">
                        <PreviewIcon sx={{ color: form.iconColor || DEFAULT_ICON_COLOR }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Màu icon"
                value={form.iconColor || `Mặc định (${DEFAULT_ICON_COLOR})`}
                fullWidth
                onClick={(e) => setColorAnchor(e.currentTarget)}
                slotProps={{
                  input: {
                    readOnly: true,
                    sx: { cursor: "pointer" },
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: toHex(form.iconColor),
                            border: 1,
                            borderColor: "divider",
                          }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Thứ tự" type="number" value={form.sortOrder} onChange={setField("sortOrder")} fullWidth
                helperText="Tự động theo menu cha"
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><FormatListNumbered fontSize="small" /></InputAdornment>) } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={setSwitch("isActive")} />} label="Kích hoạt" />
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
            Bạn có chắc muốn xóa menu <strong>{deleteTarget?.text}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        }
      />

      <Backdrop open={refreshing && !loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backgroundColor: "transparent" }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Bảng chọn màu icon: token theo theme, hoặc mã màu tự chọn */}
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 320, p: 2 } } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Màu theo theme (src/palette.js)
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {PALETTE_SWATCHES.map((s) => (
            <Tooltip key={s.token} title={`${s.token} — ${s.value}`}>
              <Box
                onClick={() => {
                  setForm((f) => ({ ...f, iconColor: s.token }));
                  setColorAnchor(null);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: s.value,
                  cursor: "pointer",
                  border: 2,
                  borderColor: form.iconColor === s.token ? "text.primary" : "transparent",
                  "&:hover": { opacity: 0.8 },
                }}
              />
            </Tooltip>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Màu tự chọn"
            type="color"
            size="small"
            value={toHex(form.iconColor)}
            onChange={(e) => setForm((f) => ({ ...f, iconColor: e.target.value }))}
            sx={{ width: 110 }}
          />
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => {
              setForm((f) => ({ ...f, iconColor: "" }));
              setColorAnchor(null);
            }}
          >
            Dùng mặc định
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Để trống = lấy màu {DEFAULT_ICON_COLOR} của theme.
        </Typography>
      </Popover>

      {/* Bảng chọn icon dạng lưới */}
      <Popover
        open={Boolean(iconAnchor)}
        anchorEl={iconAnchor}
        onClose={() => setIconAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 460, p: 1.5 } } }}
      >
        <TextField
          size="small"
          fullWidth
          autoFocus
          placeholder="Tìm icon..."
          value={iconSearch}
          onChange={(e) => setIconSearch(e.target.value)}
          sx={{ mb: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0.5,
            maxHeight: 340,
            overflowY: "auto",
          }}
        >
          <Box
            onClick={() => {
              setForm((f) => ({ ...f, icon: "" }));
              setIconAnchor(null);
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              p: 1,
              borderRadius: 1,
              cursor: "pointer",
              border: 1,
              borderColor: !form.icon ? "primary.main" : "transparent",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <DefaultIcon fontSize="small" sx={{ color: "text.disabled" }} />
            <Typography variant="caption" sx={{ fontSize: 10 }}>
              Không
            </Typography>
          </Box>
          {filteredIcons.map((name) => {
            const OptIcon = resolveIcon(name);
            const selected = form.icon === name;
            return (
              <Box
                key={name}
                onClick={() => {
                  setForm((f) => ({ ...f, icon: name }));
                  setIconAnchor(null);
                }}
                title={name}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  p: 1,
                  borderRadius: 1,
                  cursor: "pointer",
                  border: 1,
                  borderColor: selected ? "primary.main" : "transparent",
                  bgcolor: selected ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <OptIcon sx={{ color: "primary.main" }} />
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontSize: 10, maxWidth: "100%" }}
                >
                  {name}
                </Typography>
              </Box>
            );
          })}
          {filteredIcons.length === 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ gridColumn: "1 / -1", textAlign: "center", py: 2 }}
            >
              Không tìm thấy icon
            </Typography>
          )}
        </Box>
      </Popover>

    </Box>
  );
}
