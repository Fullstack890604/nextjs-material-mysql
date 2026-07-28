export const palette = {
  primary: {
    main: "#0277BD",
    light: "#4FC3F7",
    dark: "#01579B",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#26A69A",
    light: "#80CBC4",
    dark: "#00796B",
    contrastText: "#ffffff",
  },
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
    main: "#2e7d32",
    light: "#4caf50",
    dark: "#1b5e20",
    contrastText: "#ffffff",
  },
  error: {
    main: "#d32f2f",
    light: "#ef5350",
    dark: "#c62828",
    contrastText: "#ffffff",
  },
};
