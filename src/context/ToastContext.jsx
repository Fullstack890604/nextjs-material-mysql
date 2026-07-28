"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, AlertTitle, LinearProgress, Snackbar } from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/material";

const ToastContext = createContext(null);

// Thời gian tự đóng (ms)
const DURATION = 4000;
// Chu kỳ cập nhật thanh đếm ngược (ms)
const TICK = 30;

// Tiêu đề mặc định theo loại
const TITLES = {
  success: "Thành công",
  error: "Lỗi",
  warning: "Cảnh báo",
  info: "Thông tin",
};

/**
 * Provider quản lý thông báo (toast) dùng chung toàn hệ thống.
 * Đặt 1 lần ở layout gốc, mọi trang chỉ cần gọi useToast().notify(...).
 */
export function ToastProvider({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [toast, setToast] = useState({
    id: 0,
    open: false,
    msg: "",
    severity: "success",
    title: "",
  });
  const [progress, setProgress] = useState(100);

  // notify(msg, severity, title?)
  //   severity: "success" | "error" | "warning" | "info"
  //   title: tùy chọn, mặc định lấy theo severity
  const notify = useCallback((msg, severity = "success", title) => {
    setToast((t) => ({
      id: t.id + 1,
      open: true,
      msg,
      severity,
      title: title !== undefined ? title : TITLES[severity] || "",
    }));
  }, []);

  const close = useCallback((_, reason) => {
    if (reason === "clickaway") return;
    setToast((t) => ({ ...t, open: false }));
  }, []);

  // Đếm ngược thanh tiến trình theo mỗi lần mở
  useEffect(() => {
    if (!toast.open) return;
    setProgress(100);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remain = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remain);
      if (remain <= 0) clearInterval(timer);
    }, TICK);
    return () => clearInterval(timer);
  }, [toast.id, toast.open]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast.id}
        open={toast.open}
        autoHideDuration={DURATION}
        onClose={close}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "right",
        }}
        sx={isMobile ? { left: 8, right: 8 } : undefined}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{
            position: "relative",
            width: isMobile ? "100%" : undefined,
            minWidth: isMobile ? 0 : 300,
            maxWidth: isMobile ? "100%" : 420,
            boxShadow: 4,
            py: isMobile ? 0.25 : undefined,
            pb: isMobile ? 1 : 1.5,
            overflow: "hidden",
            color: "common.white",
            fontSize: isMobile ? 13 : undefined,
            "& .MuiAlert-icon": {
              color: "inherit",
              py: isMobile ? 0.75 : undefined,
              fontSize: isMobile ? 20 : undefined,
            },
            "& .MuiAlert-action": {
              color: "inherit",
            },
          }}
        >
          {toast.title && (
            <AlertTitle
              sx={{
                fontWeight: 700,
                mb: isMobile ? 0 : 0.25,
                fontSize: isMobile ? 13 : undefined,
                color: "inherit",
              }}
            >
              {toast.title}
            </AlertTitle>
          )}
          {toast.msg}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 3,
              bgcolor: "rgba(255,255,255,0.28)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#fff",
              },
            }}
          />
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }
  return ctx;
}
