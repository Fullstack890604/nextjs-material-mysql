"use client";

import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Nút đóng (X) đặt ở góc phải phía trên của Dialog.
 * Đặt như một phần tử con của <Dialog>, ngay sau <DialogTitle>.
 * Vị trí absolute so với khung Dialog (Paper).
 *
 * @param {Function} onClick  Callback khi bấm đóng
 * @param {object}   sx       Ghi đè style tùy chọn
 */
export default function DialogCloseButton({ onClick, sx }) {
  return (
    <IconButton
      aria-label="Đóng"
      onClick={onClick}
      sx={{ position: "absolute", right: 8, top: 8, color: "#fff", ...sx }}
    >
      <Close />
    </IconButton>
  );
}
