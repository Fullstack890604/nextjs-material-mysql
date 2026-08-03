"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Lock,
  Person,
  Apps,
  CheckCircleOutline,
  ShieldOutlined,
  SpeedOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { resolveDefaultPage } from "@/lib/defaultPage";

const REMEMBER_KEY = "crm_remember_username";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [username, setUsername] = useState("lytp");
  const [password, setPassword] = useState("300891");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(resolveDefaultPage(user.defaultPage));
  }, [user, router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setUsername(saved);
        setRemember(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(username.trim(), password);
    if (result.success) {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      router.replace(resolveDefaultPage(result.user?.defaultPage));
    } else {
      setError(result.message);
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(360px, 0.9fr) minmax(480px, 1.1fr)" },
        alignItems: "center",
        p: { xs: 2, sm: 3, md: 4 },
        gap: { md: 4 },
        bgcolor: "background.default",
        backgroundImage: (theme) =>
          `radial-gradient(circle at 12% 8%, ${theme.palette.primary.light}24, transparent 34%), radial-gradient(circle at 88% 92%, ${theme.palette.secondary.light}1F, transparent 30%)`,
      }}
    >
      <Box
        component="section"
        aria-label="Giới thiệu hệ thống"
        sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "center", p: { md: 3, lg: 7 }, maxWidth: 680 }}
      >
        <Box sx={{ width: 56, height: 56, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", boxShadow: 2, mb: 3 }}>
          <Apps sx={{ fontSize: 30 }} />
        </Box>
        <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={1.4}>
          Nền tảng vận hành tập trung
        </Typography>
        <Typography component="h1" variant="h3" sx={{ mt: 1, maxWidth: 580 }}>
          Quản lý rõ ràng, vận hành liền mạch.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 560, fontSize: 18 }}>
          Truy cập dữ liệu, danh mục và phân quyền trong một không gian làm việc an toàn, nhất quán.
        </Typography>
        <Stack spacing={1.75} sx={{ mt: 4 }}>
          {[
            [SpeedOutlined, "Thao tác nhanh với giao diện tối ưu cho công việc hằng ngày"],
            [ShieldOutlined, "Kiểm soát truy cập và phiên đăng nhập an toàn"],
            [CheckCircleOutline, "Dữ liệu được tổ chức rõ ràng, dễ theo dõi"],
          ].map(([Icon, text]) => (
            <Stack key={text} direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "background.paper", color: "primary.main", display: "grid", placeItems: "center", border: 1, borderColor: "divider" }}>
                <Icon fontSize="small" />
              </Box>
              <Typography color="text.secondary">{text}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Paper elevation={2} sx={{ width: "100%", maxWidth: 460, p: { xs: 3, sm: 4.5 }, justifySelf: { md: "center" }, borderRadius: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            mb: 4,
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", mb: 1.5, width: 52, height: 52, display: { md: "none" } }}>
            <Apps />
          </Avatar>
          <Typography component="h1" variant="h5" fontWeight={700} color="text.primary">
            Chào mừng trở lại
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Đăng nhập để tiếp tục vào hệ thống quản trị
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField
            label="Tài khoản"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tài khoản ..."
            fullWidth
            required
            autoFocus
            autoComplete="username"
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

          <TextField
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu ..."
            fullWidth
            required
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
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && <Alert severity="error" role="alert">{error}</Alert>}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={submitting}
          >
            {submitting ? <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />Đang đăng nhập...</> : "Đăng nhập"}
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 3 }}
        >
          © {new Date().getFullYear()} Hệ thống quản trị · Kết nối an toàn
        </Typography>
      </Paper>
    </Box>
  );
}
