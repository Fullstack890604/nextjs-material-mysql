import { palette as basePalette } from "@/palette";

/**
 * Bộ giao diện của app — 14 bảng màu sáng, tông **dịu**: mỗi màu chính được giảm bão
 * hoà (~30% so với bảng gốc) rồi chỉnh sáng để tương phản với chữ trắng rơi vào
 * khoảng 4.3:1. Nhờ vậy màu nhìn nhạt/êm hơn hẳn bộ trước mà chữ trắng trên nền màu
 * vẫn đọc được. Nguyên tắc chung cho mỗi bảng:
 *
 * - `primary.main` / `secondary.main` phải giữ được chữ trắng, vì tiêu đề Dialog ở các
 *   trang đang đặt cứng `color: "#fff"` trên hai màu này (và header bảng dùng
 *   `primary.contrastText`). Muốn nhạt hơn nữa thì hạ ở `light`, đừng hạ ở `main`.
 * - `light` dùng cho chấm màu / viền nhạt, `dark` chỉ dùng cho trạng thái hover.
 * - `background.default` là sắc thái nhạt nhất của cùng tông màu, `paper` luôn trắng;
 *   `divider` là tông xám-màu rất nhạt để đường kẻ không cắt ngang giao diện.
 * - Chữ dùng mực xám-lạnh (`coolText`) cho tông lạnh và xám-ấm (`warmText`) cho tông ấm.
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
const coolText = { primary: "#28323F", secondary: "#6B7787", disabled: "#A0A9B4" };
const warmText = { primary: "#332E2A", secondary: "#7E756D", disabled: "#B0A79F" };

export const themePresets = {
  slate: {
    ...basePalette,
    primary: { main: "#6F7B8C", light: "#B7BDC4", dark: "#55606E", contrastText: "#FFFFFF" },
    secondary: { main: "#1F81B4", light: "#89C4E2", dark: "#13658F", contrastText: "#FFFFFF" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: coolText,
    divider: "#E7EAEE",
    ...statusColors,
  },
  blue: {
    ...basePalette,
    primary: { main: "#4D77D2", light: "#AABCE4", dark: "#2959C1", contrastText: "#FFFFFF" },
    secondary: { main: "#28849E", light: "#85C6D8", dark: "#1B677C", contrastText: "#FFFFFF" },
    background: { default: "#F6F9FE", paper: "#FFFFFF" },
    text: coolText,
    divider: "#DDE5F5",
    ...statusColors,
  },
  sky: {
    ...basePalette,
    primary: { main: "#1F81B4", light: "#89C4E2", dark: "#13658F", contrastText: "#FFFFFF" },
    secondary: { main: "#6C6EDA", light: "#B7B8E8", dark: "#484BD8", contrastText: "#FFFFFF" },
    background: { default: "#F4FAFD", paper: "#FFFFFF" },
    text: coolText,
    divider: "#D8E8F2",
    ...statusColors,
  },
  ocean: {
    ...basePalette,
    primary: { main: "#28849E", light: "#85C6D8", dark: "#1B677C", contrastText: "#FFFFFF" },
    secondary: { main: "#4D77D2", light: "#AABCE4", dark: "#2959C1", contrastText: "#FFFFFF" },
    background: { default: "#F3FBFC", paper: "#FFFFFF" },
    text: coolText,
    divider: "#D7E8ED",
    ...statusColors,
  },
  teal: {
    ...basePalette,
    primary: { main: "#268780", light: "#6DCCC4", dark: "#1A6A63", contrastText: "#FFFFFF" },
    secondary: { main: "#1F81B4", light: "#89C4E2", dark: "#13658F", contrastText: "#FFFFFF" },
    background: { default: "#F3FBFA", paper: "#FFFFFF" },
    text: coolText,
    divider: "#D6EAE8",
    ...statusColors,
  },
  emerald: {
    ...basePalette,
    primary: { main: "#1B8A6B", light: "#50D1AC", dark: "#116C52", contrastText: "#FFFFFF" },
    secondary: { main: "#5C8625", light: "#9ECA64", dark: "#476919", contrastText: "#FFFFFF" },
    background: { default: "#F2FBF7", paper: "#FFFFFF" },
    text: coolText,
    divider: "#D5EDE5",
    ...statusColors,
  },
  olive: {
    ...basePalette,
    primary: { main: "#5C8625", light: "#9ECA64", dark: "#476919", contrastText: "#FFFFFF" },
    secondary: { main: "#B66526", light: "#E0B391", dark: "#914D19", contrastText: "#FFFFFF" },
    background: { default: "#F9FCF1", paper: "#FFFFFF" },
    text: warmText,
    divider: "#E2EDD2",
    ...statusColors,
  },
  honey: {
    ...basePalette,
    primary: { main: "#B66526", light: "#E0B391", dark: "#914D19", contrastText: "#FFFFFF" },
    secondary: { main: "#5C8625", light: "#9ECA64", dark: "#476919", contrastText: "#FFFFFF" },
    background: { default: "#FEFBF3", paper: "#FFFFFF" },
    text: warmText,
    divider: "#F0E3D3",
    ...statusColors,
  },
  peach: {
    ...basePalette,
    primary: { main: "#C7592C", light: "#E2B19D", dark: "#9F431D", contrastText: "#FFFFFF" },
    secondary: { main: "#B66526", light: "#E0B391", dark: "#914D19", contrastText: "#FFFFFF" },
    background: { default: "#FEF9F5", paper: "#FFFFFF" },
    text: warmText,
    divider: "#F2E0D7",
    ...statusColors,
  },
  rose: {
    ...basePalette,
    primary: { main: "#CC4E6A", light: "#E3AEBA", dark: "#AF2B48", contrastText: "#FFFFFF" },
    secondary: { main: "#C7592C", light: "#E2B19D", dark: "#9F431D", contrastText: "#FFFFFF" },
    background: { default: "#FEF6F7", paper: "#FFFFFF" },
    text: warmText,
    divider: "#F3DDE2",
    ...statusColors,
  },
  pink: {
    ...basePalette,
    primary: { main: "#C74F84", light: "#E0AEC4", dark: "#A83065", contrastText: "#FFFFFF" },
    secondary: { main: "#9B5CD5", light: "#CDB2E5", dark: "#832FD0", contrastText: "#FFFFFF" },
    background: { default: "#FDF6FA", paper: "#FFFFFF" },
    text: warmText,
    divider: "#F2DCE6",
    ...statusColors,
  },
  orchid: {
    ...basePalette,
    primary: { main: "#B74DC4", light: "#D9AEDF", dark: "#9731A4", contrastText: "#FFFFFF" },
    secondary: { main: "#C74F84", light: "#E0AEC4", dark: "#A83065", contrastText: "#FFFFFF" },
    background: { default: "#FCF6FD", paper: "#FFFFFF" },
    text: coolText,
    divider: "#EEDDF1",
    ...statusColors,
  },
  violet: {
    ...basePalette,
    primary: { main: "#8E62D8", light: "#C6B3E7", dark: "#7339D5", contrastText: "#FFFFFF" },
    secondary: { main: "#C74F84", light: "#E0AEC4", dark: "#A83065", contrastText: "#FFFFFF" },
    background: { default: "#F9F6FE", paper: "#FFFFFF" },
    text: coolText,
    divider: "#E5DCF3",
    ...statusColors,
  },
  indigo: {
    ...basePalette,
    primary: { main: "#6C6EDA", light: "#B7B8E8", dark: "#484BD8", contrastText: "#FFFFFF" },
    secondary: { main: "#1F81B4", light: "#89C4E2", dark: "#13658F", contrastText: "#FFFFFF" },
    background: { default: "#F6F7FE", paper: "#FFFFFF" },
    text: coolText,
    divider: "#E0E1F6",
    ...statusColors,
  },
};

/** Danh sách hiện trong menu chọn giao diện — `color` là chấm màu xem trước. */
export const themeOptions = [
  { key: "slate", label: "Xám khói", color: "#6F7B8C" },
  { key: "blue", label: "Xanh dương", color: "#4D77D2" },
  { key: "sky", label: "Xanh trời", color: "#1F81B4" },
  { key: "ocean", label: "Xanh biển", color: "#28849E" },
  { key: "teal", label: "Xanh ngọc", color: "#268780" },
  { key: "emerald", label: "Lục bảo", color: "#1B8A6B" },
  { key: "olive", label: "Ô liu", color: "#5C8625" },
  { key: "honey", label: "Mật ong", color: "#B66526" },
  { key: "peach", label: "Cam đào", color: "#C7592C" },
  { key: "rose", label: "Hồng đỏ", color: "#CC4E6A" },
  { key: "pink", label: "Hồng phấn", color: "#C74F84" },
  { key: "orchid", label: "Tím lan", color: "#B74DC4" },
  { key: "violet", label: "Tím", color: "#8E62D8" },
  { key: "indigo", label: "Chàm", color: "#6C6EDA" },
];

/** Giao diện mặc định cho người dùng mới / khi lựa chọn cũ không còn tồn tại. */
export const DEFAULT_THEME_KEY = "sky";
