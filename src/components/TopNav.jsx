"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  MenuOpen as MenuOpenIcon,
  Notifications,
  Logout,
  KeyboardArrowDown,
  LockReset,
  Lock,
  LockOpen,
  Key,
  Palette,
  Visibility,
  VisibilityOff,
  Dashboard,
  Search,
  Clear,
  ArrowBack,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import { useThemeSelection } from "@/components/AppThemeProvider";
import { themeOptions } from "@/themePresets";
import ConfirmDialog from "@/components/ConfirmDialog";
import DialogCloseButton from "@/components/DialogCloseButton";

const notifications = [
  { id: 1, text: "Bệnh nhân Nguyễn Văn A đã đặt lịch hẹn", time: "5 phút trước" },
  { id: 2, text: "Nhắc lịch tái khám cho Trần Thị B", time: "1 giờ trước" },
  { id: 3, text: "Hóa đơn #1024 đã được thanh toán", time: "Hôm qua" },
];

// Chữ viết tắt hiển thị trong Avatar: lấy chữ cái đầu của 2 từ cuối trong họ tên
// (vd. "Thạch Phú Ly" -> "PL"), nếu chỉ có 1 từ thì lấy chữ cái đầu (vd. "Ly" -> "L").
const getInitials = (name) => {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(-2)
    .map((w) => w.charAt(0).toLocaleUpperCase("vi-VN"))
    .join("");
};

export default function TopNav({ onToggleSidebar, sidebarOpen = true }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { themeKey, selectTheme } = useThemeSelection();

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [themeAnchor, setThemeAnchor] = useState(null);

  // Tìm kiếm trên TopNav - giá trị & placeholder do trang hiện tại quyết định (usePageSearch)
  const { searchValue, setSearchValue, placeholder: searchPlaceholder } = useSearch();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Đổi mật khẩu
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [toast, setToast] = useState(false);

  // Xác nhận đăng xuất
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const openLogoutConfirm = () => {
    setMenuAnchor(null);
    setLogoutConfirmOpen(true);
  };

  const handleLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    router.replace("/login");
  };

  const openPwdDialog = () => {
    setMenuAnchor(null);
    setPwdForm({ current: "", next: "", confirm: "" });
    setPwdError("");
    setPwdOpen(true);
  };

  const setPwdField = (key) => (e) =>
    setPwdForm((f) => ({ ...f, [key]: e.target.value }));

  const handleChangePassword = async () => {
    setPwdError("");
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) {
      setPwdError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdError("Mật khẩu mới và xác nhận không khớp");
      return;
    }
    if (pwdForm.next === pwdForm.current) {
      setPwdError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username,
          currentPassword: pwdForm.current,
          newPassword: pwdForm.next,
        }),
      });
      const data = await res.json();
      if (data.status === "OK") {
        setPwdOpen(false);
        setToast(true);
      } else {
        setPwdError(data.message || "Đổi mật khẩu thất bại");
      }
    } catch {
      setPwdError("Không thể kết nối máy chủ");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ bgcolor: "background.paper" }}
      >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: 64,
          position: "relative",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {/* Bên trái */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexShrink: 0 }}>
          <IconButton
            onClick={onToggleSidebar}
            aria-label="Ẩn/hiện thanh bên"
            sx={{
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <MenuOpenIcon
              sx={{
                fontSize: 28,
                transform: sidebarOpen ? "none" : "scaleX(-1)",
                transition: "transform .2s ease",
              }}
            />
          </IconButton>

          {/* Logo thương hiệu (chỉ hiện trên mobile, desktop đã có ở sidebar); ẩn khi đang mở khung tìm kiếm mobile để nhường chỗ */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: mobileSearchOpen ? "none" : { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              textDecoration: "none",
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Dashboard fontSize="small" />
            </Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary.main"
              noWrap
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              NextJS - Material UI
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary.main"
              noWrap
              sx={{ display: { xs: "block", sm: "none" } }}
            >
              Material UI
            </Typography>
          </Box>
        </Box>

        {/* Bên phải */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: mobileSearchOpen ? 1 : "initial",
            minWidth: 0,
          }}
        >
          {/* Tìm kiếm - desktop: luôn hiển thị đầy đủ */}
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={{
              display: { xs: "none", sm: "flex" },
              position: { xs: "static", sm: "absolute" },
              left: { sm: 72, md: 88 },
              transform: "none",
              width: { sm: 240, md: 320 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "action.hover",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: "transparent" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
                "&.Mui-focused": { bgcolor: "background.paper" },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setSearchValue("")}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          {/* Tìm kiếm - mobile: nút kính lúp, nhấn vào mới hiện khung nhập */}
          {mobileSearchOpen ? (
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{
                display: { xs: "flex", sm: "none" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  bgcolor: "action.hover",
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: "transparent" },
                  "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  "&.Mui-focused": { bgcolor: "background.paper" },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        size="small"
                        aria-label="Đóng tìm kiếm"
                        onClick={() => {
                          setMobileSearchOpen(false);
                          setSearchValue("");
                        }}
                      >
                        <ArrowBack fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: searchValue ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => setSearchValue("")}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          ) : (
            <IconButton
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Tìm kiếm"
              sx={{
                display: { xs: "flex", sm: "none" },
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <Search />
            </IconButton>
          )}

          {/* Chọn theme */}
          <IconButton
            onClick={(e) => setThemeAnchor(e.currentTarget)}
            aria-label="Chọn giao diện"
            aria-controls={themeAnchor ? "theme-menu" : undefined}
            aria-haspopup="true"
            sx={{
              display: "none",
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <Palette />
          </IconButton>
          <Menu
            id="theme-menu"
            anchorEl={themeAnchor}
            open={Boolean(themeAnchor)}
            onClose={() => setThemeAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  width: 280,
                  // 14 bảng màu xếp 2 cột -> giới hạn chiều cao rồi cho cuộn, thay vì
                  // để menu dài quá màn hình.
                  maxHeight: "70vh",
                  mt: 1,
                  "& .MuiMenu-list": {
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 0.5,
                    p: 1,
                  },
                  "& .theme-menu-heading": { gridColumn: "1 / -1" },
                  "& .MuiMenuItem-root": { borderRadius: 1, fontSize: 14 },
                },
              },
            }}
          >
            <MenuItem className="theme-menu-heading" disabled sx={{ opacity: 1, fontWeight: 700, color: "text.primary" }}>
              <ListItemIcon>
                <Palette fontSize="small" />
              </ListItemIcon>
              Giao diện
            </MenuItem>
            {themeOptions.map((option) => (
              <MenuItem
                key={option.key}
                selected={themeKey === option.key}
                onClick={() => {
                  selectTheme(option.key);
                  setThemeAnchor(null);
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box
                    aria-hidden="true"
                    sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: option.color, border: 1, borderColor: "divider" }}
                  />
                </ListItemIcon>
                {option.label}
              </MenuItem>
            ))}
          </Menu>

          {/* Chuông thông báo */}
          <IconButton
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            aria-label="Thông báo"
            sx={{
              display: mobileSearchOpen ? { xs: "none", sm: "flex" } : "flex",
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <Badge badgeContent={notifications.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { width: 320, mt: 1 } } }}
          >
            <Typography sx={{ px: 2, py: 1.5, fontWeight: 600 }}>
              Thông báo
            </Typography>
            <Divider />
            {notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => setNotifAnchor(null)}
                sx={{ display: "block", whiteSpace: "normal", py: 1.25 }}
              >
                <Typography variant="body2">{n.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.time}
                </Typography>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              onClick={() => setNotifAnchor(null)}
              sx={{ justifyContent: "center", color: "primary.main", fontWeight: 500 }}
            >
              Xem tất cả
            </MenuItem>
          </Menu>

          {/* Lời chào + menu user */}
          <Box
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              display: mobileSearchOpen ? { xs: "none", sm: "flex" } : "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "action.hover",
              cursor: "pointer",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontWeight: 700 }}>
              {getInitials(user?.name)}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Xin chào,
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {user?.name || "Người dùng"}
              </Typography>
            </Box>
            <KeyboardArrowDown fontSize="small" sx={{ color: "text.secondary" }} />
          </Box>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { width: 200, mt: 1 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{user?.username}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={openPwdDialog}>
              <ListItemIcon>
                <LockReset fontSize="small" />
              </ListItemIcon>
              Đổi mật khẩu
            </MenuItem>
            <MenuItem onClick={openLogoutConfirm} sx={{ color: "error.main" }}>
              <ListItemIcon sx={{ color: "error.main" }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              Đăng xuất
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>

    {/* Nút chọn theme nổi trên mobile */}
    <Fab
      size="medium"
      color="primary"
      aria-label="Chọn giao diện"
      aria-controls={themeAnchor ? "theme-menu" : undefined}
      aria-haspopup="true"
      onClick={(e) => setThemeAnchor(e.currentTarget)}
      sx={{
        display: "flex",
        position: "fixed",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: (theme) => theme.zIndex.appBar + 1,
        minHeight: 44,
        width: 44,
        height: 44,
      }}
    >
      <Palette />
    </Fab>

      {/* Dialog đổi mật khẩu */}
      <Dialog
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#fff",
            bgcolor: "secondary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LockReset /> Đổi mật khẩu
        </DialogTitle>
        <DialogCloseButton onClick={() => setPwdOpen(false)} />
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Mật khẩu hiện tại"
              type={showPwd ? "text" : "password"}
              value={pwdForm.current}
              onChange={setPwdField("current")}
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPwd((s) => !s)}
                        edge="end"
                      >
                        {showPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Mật khẩu mới"
              type={showPwd ? "text" : "password"}
              value={pwdForm.next}
              onChange={setPwdField("next")}
              fullWidth
              autoComplete="new-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOpen fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              type={showPwd ? "text" : "password"}
              value={pwdForm.confirm}
              onChange={setPwdField("confirm")}
              fullWidth
              autoComplete="new-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {pwdError && <Alert severity="error">{pwdError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setPwdOpen(false)}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleChangePassword}
            disabled={pwdSaving}
            sx={{ border: 1, borderColor: "secondary.dark" }}
          >
            {pwdSaving ? "Đang lưu..." : "Cập nhật"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast}
        autoHideDuration={3000}
        onClose={() => setToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(false)}>
          Đổi mật khẩu thành công
        </Alert>
      </Snackbar>

      {/* Dialog xác nhận đăng xuất */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        type="warning"
        title="Xác nhận"
        confirmText="Đăng xuất"
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
      />
    </>
  );
}
