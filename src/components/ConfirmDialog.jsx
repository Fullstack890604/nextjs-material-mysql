"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import {
  WarningAmber,
  CheckCircle,
  ErrorOutline,
  DeleteOutline,
  InfoOutlined,
  HelpOutline,
} from "@mui/icons-material";
import DialogCloseButton from "@/components/DialogCloseButton";

// Cấu hình màu sắc + icon theo từng loại dialog
const TYPES = {
  confirm: { color: "primary", icon: HelpOutline },
  delete: { color: "error", icon: DeleteOutline },
  error: { color: "error", icon: ErrorOutline },
  warning: { color: "warning", icon: WarningAmber },
  success: { color: "success", icon: CheckCircle },
  info: { color: "info", icon: InfoOutlined },
};

/**
 * Dialog xác nhận dùng chung cho toàn hệ thống.
 *
 * @param {boolean}  open        Mở/đóng dialog
 * @param {string}   type        "confirm" | "delete" | "error" | "warning" | "success" | "info"
 * @param {string}   title       Tiêu đề
 * @param {ReactNode} message    Nội dung (chuỗi hoặc JSX)
 * @param {string}   confirmText Nhãn nút xác nhận
 * @param {string}   cancelText  Nhãn nút hủy (ẩn nếu = null)
 * @param {boolean}  loading     Đang xử lý (khóa nút)
 * @param {Function} onConfirm   Callback khi bấm xác nhận
 * @param {Function} onClose     Callback khi đóng/hủy
 * @param {string}   maxWidth    Kích thước dialog (mặc định "xs")
 */
export default function ConfirmDialog({
  open,
  type = "confirm",
  title,
  message,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  loading = false,
  onConfirm,
  onClose,
  maxWidth = "xs",
}) {
  const cfg = TYPES[type] || TYPES.confirm;
  const Icon = cfg.icon;

  // Không đóng khi click ra ngoài nền (backdrop); vẫn cho đóng bằng nút / Esc
  const handleClose = (event, reason) => {
    if (reason === "backdropClick") return;
    onClose?.(event, reason);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: "#fff",
          bgcolor: `${cfg.color}.main`,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon /> {title}
      </DialogTitle>
      <DialogCloseButton onClick={onClose} />

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {typeof message === "string" ? (
            <Typography variant="body2">{message}</Typography>
          ) : (
            message
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}>
        {cancelText !== null && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}
        <Button
          variant="contained"
          color={cfg.color}
          onClick={onConfirm}
          disabled={loading}
          sx={{ border: 1, borderColor: `${cfg.color}.dark` }}
        >
          {loading ? "Đang xử lý..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
