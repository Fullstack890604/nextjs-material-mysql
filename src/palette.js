export const palette = {
  mode: "light",
  primary: {
    main: "#475569",
    light: "#64748B",
    dark: "#334155",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#64748B",
    light: "#94A3B8",
    dark: "#475569",
    contrastText: "#ffffff",
  },
  background: {
    default: "#F8FAFC",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#0F172A",
    secondary: "#475569",
    disabled: "#94A3B8",
  },
  divider: "#E2E8F0",
  // Màu trạng thái (dùng cho Chip/Dot trạng thái lịch hẹn qua statusColor()):
  //   Chờ xác nhận -> warning | Đã xác nhận -> info | Đã đến -> primary
  //   Hoàn thành   -> success | Đã hủy      -> error
  warning: {
    main: "#ed6c02",
    light: "#ff9800",
    dark: "#e65100",
    contrastText: "#ffffff",
  },
  info: {
    main: "#0288d1",
    light: "#03a9f4",
    dark: "#01579b",
    contrastText: "#ffffff",
  },
  success: {
    main: "#059669",
    light: "#34D399",
    dark: "#047857",
    contrastText: "#ffffff",
  },
  error: {
    main: "#d32f2f",
    light: "#ef5350",
    dark: "#c62828",
    contrastText: "#ffffff",
  },
};
