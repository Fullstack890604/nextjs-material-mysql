import { palette as basePalette } from "@/palette";

/**
 * Bộ giao diện của app — 14 bảng màu sáng, tông vừa phải (không quá đậm, không
 * chói). Nguyên tắc chung cho mỗi bảng:
 *
 * - `primary.main` / `secondary.main` luôn đủ tương phản với chữ trắng, vì tiêu đề
 *   Dialog ở các trang đang đặt cứng `color: "#fff"` trên nền hai màu này (và header
 *   bảng dùng `primary.contrastText`). Vì vậy màu chính nằm ở tông giữa — sáng hơn
 *   bộ cũ nhưng vẫn đọc được chữ trắng — chứ không phải pastel.
 * - `light` dùng cho chấm màu / viền nhạt, `dark` chỉ dùng cho trạng thái hover.
 * - `background.default` là sắc thái nhạt nhất của cùng tông màu, `paper` luôn trắng.
 * - Chữ dùng mực xám-lạnh (#1E293B) cho tông lạnh và xám-ấm (#292524) cho tông ấm,
 *   thay cho mực gần đen của bộ cũ.
 * - Màu trạng thái (success/warning/info/error) giữ nguyên ở mọi bảng để Chip trạng
 *   thái không đổi nghĩa khi người dùng đổi giao diện.
 */

const statusColors = {
  warning: basePalette.warning,
  info: basePalette.info,
  success: basePalette.success,
  error: basePalette.error,
};

/** Mực chữ dùng chung — tông lạnh và tông ấm. */
const coolText = { primary: "#1E293B", secondary: "#64748B", disabled: "#94A3B8" };
const warmText = { primary: "#292524", secondary: "#78716C", disabled: "#A8A29E" };

export const themePresets = {
  slate: {
    ...basePalette,
    primary: { main: "#64748B", light: "#94A3B8", dark: "#475569", contrastText: "#FFFFFF" },
    secondary: { main: "#0284C7", light: "#38BDF8", dark: "#0369A1", contrastText: "#FFFFFF" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: coolText,
    divider: "#E2E8F0",
    ...statusColors,
  },
  blue: {
    ...basePalette,
    primary: { main: "#2563EB", light: "#60A5FA", dark: "#1D4ED8", contrastText: "#FFFFFF" },
    secondary: { main: "#0E7490", light: "#22D3EE", dark: "#155E75", contrastText: "#FFFFFF" },
    background: { default: "#F5F9FF", paper: "#FFFFFF" },
    text: coolText,
    divider: "#DBEAFE",
    ...statusColors,
  },
  sky: {
    ...basePalette,
    primary: { main: "#0284C7", light: "#38BDF8", dark: "#0369A1", contrastText: "#FFFFFF" },
    secondary: { main: "#6366F1", light: "#A5B4FC", dark: "#4F46E5", contrastText: "#FFFFFF" },
    background: { default: "#F0F9FF", paper: "#FFFFFF" },
    text: coolText,
    divider: "#BAE6FD",
    ...statusColors,
  },
  ocean: {
    ...basePalette,
    primary: { main: "#0E7490", light: "#22D3EE", dark: "#155E75", contrastText: "#FFFFFF" },
    secondary: { main: "#2563EB", light: "#60A5FA", dark: "#1D4ED8", contrastText: "#FFFFFF" },
    background: { default: "#ECFEFF", paper: "#FFFFFF" },
    text: coolText,
    divider: "#A5F3FC",
    ...statusColors,
  },
  teal: {
    ...basePalette,
    primary: { main: "#0F766E", light: "#2DD4BF", dark: "#115E59", contrastText: "#FFFFFF" },
    secondary: { main: "#0284C7", light: "#38BDF8", dark: "#0369A1", contrastText: "#FFFFFF" },
    background: { default: "#F0FDFA", paper: "#FFFFFF" },
    text: coolText,
    divider: "#99F6E4",
    ...statusColors,
  },
  emerald: {
    ...basePalette,
    primary: { main: "#047857", light: "#34D399", dark: "#065F46", contrastText: "#FFFFFF" },
    secondary: { main: "#4D7C0F", light: "#A3E635", dark: "#3F6212", contrastText: "#FFFFFF" },
    background: { default: "#ECFDF5", paper: "#FFFFFF" },
    text: coolText,
    divider: "#A7F3D0",
    ...statusColors,
  },
  olive: {
    ...basePalette,
    primary: { main: "#4D7C0F", light: "#A3E635", dark: "#3F6212", contrastText: "#FFFFFF" },
    secondary: { main: "#B45309", light: "#FBBF24", dark: "#92400E", contrastText: "#FFFFFF" },
    background: { default: "#F7FEE7", paper: "#FFFFFF" },
    text: warmText,
    divider: "#D9F99D",
    ...statusColors,
  },
  honey: {
    ...basePalette,
    primary: { main: "#B45309", light: "#FBBF24", dark: "#92400E", contrastText: "#FFFFFF" },
    secondary: { main: "#4D7C0F", light: "#A3E635", dark: "#3F6212", contrastText: "#FFFFFF" },
    background: { default: "#FFFBEB", paper: "#FFFFFF" },
    text: warmText,
    divider: "#FDE68A",
    ...statusColors,
  },
  peach: {
    ...basePalette,
    primary: { main: "#C2410C", light: "#FB923C", dark: "#9A3412", contrastText: "#FFFFFF" },
    secondary: { main: "#B45309", light: "#FBBF24", dark: "#92400E", contrastText: "#FFFFFF" },
    background: { default: "#FFF7ED", paper: "#FFFFFF" },
    text: warmText,
    divider: "#FED7AA",
    ...statusColors,
  },
  rose: {
    ...basePalette,
    primary: { main: "#E11D48", light: "#FB7185", dark: "#BE123C", contrastText: "#FFFFFF" },
    secondary: { main: "#C2410C", light: "#FB923C", dark: "#9A3412", contrastText: "#FFFFFF" },
    background: { default: "#FFF1F2", paper: "#FFFFFF" },
    text: warmText,
    divider: "#FECDD3",
    ...statusColors,
  },
  pink: {
    ...basePalette,
    primary: { main: "#DB2777", light: "#F472B6", dark: "#BE185D", contrastText: "#FFFFFF" },
    secondary: { main: "#9333EA", light: "#C084FC", dark: "#7E22CE", contrastText: "#FFFFFF" },
    background: { default: "#FDF2F8", paper: "#FFFFFF" },
    text: warmText,
    divider: "#FBCFE8",
    ...statusColors,
  },
  orchid: {
    ...basePalette,
    primary: { main: "#C026D3", light: "#E879F9", dark: "#A21CAF", contrastText: "#FFFFFF" },
    secondary: { main: "#DB2777", light: "#F472B6", dark: "#BE185D", contrastText: "#FFFFFF" },
    background: { default: "#FDF4FF", paper: "#FFFFFF" },
    text: coolText,
    divider: "#F5D0FE",
    ...statusColors,
  },
  violet: {
    ...basePalette,
    primary: { main: "#7C3AED", light: "#A78BFA", dark: "#6D28D9", contrastText: "#FFFFFF" },
    secondary: { main: "#DB2777", light: "#F472B6", dark: "#BE185D", contrastText: "#FFFFFF" },
    background: { default: "#F5F3FF", paper: "#FFFFFF" },
    text: coolText,
    divider: "#DDD6FE",
    ...statusColors,
  },
  indigo: {
    ...basePalette,
    primary: { main: "#6366F1", light: "#A5B4FC", dark: "#4F46E5", contrastText: "#FFFFFF" },
    secondary: { main: "#0284C7", light: "#38BDF8", dark: "#0369A1", contrastText: "#FFFFFF" },
    background: { default: "#EEF2FF", paper: "#FFFFFF" },
    text: coolText,
    divider: "#E0E7FF",
    ...statusColors,
  },
};

/** Danh sách hiện trong menu chọn giao diện — `color` là chấm màu xem trước. */
export const themeOptions = [
  { key: "slate", label: "Xám khói", color: "#64748B" },
  { key: "blue", label: "Xanh dương", color: "#2563EB" },
  { key: "sky", label: "Xanh trời", color: "#0284C7" },
  { key: "ocean", label: "Xanh biển", color: "#0E7490" },
  { key: "teal", label: "Xanh ngọc", color: "#0F766E" },
  { key: "emerald", label: "Lục bảo", color: "#047857" },
  { key: "olive", label: "Ô liu", color: "#4D7C0F" },
  { key: "honey", label: "Mật ong", color: "#B45309" },
  { key: "peach", label: "Cam đào", color: "#C2410C" },
  { key: "rose", label: "Hồng đỏ", color: "#E11D48" },
  { key: "pink", label: "Hồng phấn", color: "#DB2777" },
  { key: "orchid", label: "Tím lan", color: "#C026D3" },
  { key: "violet", label: "Tím", color: "#7C3AED" },
  { key: "indigo", label: "Chàm", color: "#6366F1" },
];

/** Giao diện mặc định cho người dùng mới / khi lựa chọn cũ không còn tồn tại. */
export const DEFAULT_THEME_KEY = "sky";
