"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { GppMaybe } from "@mui/icons-material";
import {
  installAuthFetch,
  saveSession,
  clearSession,
  setSessionExpiredHandler,
  USER_KEY,
} from "@/lib/apiClient";

const AuthContext = createContext(null);

// Số giây đếm ngược trước khi buộc đăng xuất khi bị đăng nhập ở nơi khác.
const KICK_COUNTDOWN = 5;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kicked, setKicked] = useState(false);
  const [kickInfo, setKickInfo] = useState(null);
  const [countdown, setCountdown] = useState(KICK_COUNTDOWN);

  useEffect(() => {
    // Cài interceptor đính token cho mọi request /api/
    installAuthFetch();
    // Khi phiên bị đá/hết hạn: hiện đếm ngược thay vì chuyển trang ngay.
    setSessionExpiredHandler(() => setKicked(true));
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    }
    setLoading(false);
    return () => setSessionExpiredHandler(null);
  }, []);

  // SSE: mở 1 kết nối nhận sự kiện "bị đá" thay vì gọi session-check liên tục.
  // Fallback: kiểm tra 1 lần khi tab được focus/hiện lại (phòng khi mất SSE).
  useEffect(() => {
    if (!user) return undefined;
    let stopped = false;

    const trigger = () => {
      if (!stopped) {
        stopped = true;
        setKicked(true);
      }
    };

    const checkOnce = async () => {
      if (stopped || (typeof document !== "undefined" && document.hidden)) return;
      try {
        const res = await fetch("/api/auth/session-check", { cache: "no-store" });
        if (res.status === 401) trigger();
      } catch {
        // Lỗi mạng — bỏ qua
      }
    };

    let es;
    try {
      es = new EventSource("/api/auth/session-stream");
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === "kicked") {
            setKickInfo(data.device || null);
            trigger();
          }
        } catch {
          // bỏ qua message không hợp lệ (vd heartbeat)
        }
      };
      // Lỗi kết nối: EventSource tự kết nối lại, không đăng xuất ở đây.
    } catch {
      // Trình duyệt không hỗ trợ EventSource → chỉ dựa vào fallback
    }

    const onVisible = () => {
      if (!document.hidden) checkOnce();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkOnce);

    return () => {
      stopped = true;
      if (es) es.close();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkOnce);
    };
  }, [user]);

  // Khi bị đá: hiển thị thông báo + đếm ngược rồi mới buộc đăng xuất.
  const forceLogout = () => {
    setUser(null);
    clearSession();
    setKicked(false);
    setKickInfo(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    if (!kicked) return undefined;
    setCountdown(KICK_COUNTDOWN);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          forceLogout();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [kicked]);

  const login = async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.status === "OK") {
        setUser(data.data);
        saveSession(data.data);
        return { success: true, user: data.data };
      }
      return { success: false, message: data.message || "Đăng nhập thất bại" };
    } catch {
      return {
        success: false,
        message: "Không thể kết nối máy chủ. Vui lòng thử lại.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Bỏ qua lỗi mạng khi đăng xuất
    }
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}

      <Dialog
        open={kicked}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        onClose={(e, reason) => {
          if (reason === "backdropClick") return;
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#fff",
            bgcolor: "error.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <GppMaybe /> Phiên đăng nhập kết thúc
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Tài khoản của bạn vừa được đăng nhập trên một thiết bị khác. Vì lý do
            an toàn, phiên trên thiết bị này sẽ được đăng xuất.
          </Typography>

          {kickInfo && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.hover",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Thiết bị vừa đăng nhập
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {kickInfo.browser} trên {kickInfo.os}
              </Typography>
              {kickInfo.ip && (
                <Typography variant="body2" color="text.secondary">
                  IP: {kickInfo.ip}
                </Typography>
              )}
              {kickInfo.at && (
                <Typography variant="body2" color="text.secondary">
                  Thời điểm: {new Date(kickInfo.at).toLocaleString("vi-VN")}
                </Typography>
              )}
            </Box>
          )}

          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Tự động đăng xuất sau
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              color="error.main"
              sx={{ mx: 1, minWidth: 28, textAlign: "center" }}
            >
              {countdown}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              giây
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" color="error" onClick={forceLogout}>
            Đăng xuất ngay
          </Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return ctx;
}
