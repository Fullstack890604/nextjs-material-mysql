"use client";

import { Box, Typography } from "@mui/material";

/**
 * Ô số liệu dạng nhãn/giá trị xếp dọc, dùng cho lưới nhiều cột — gọn và dễ quét theo hàng/cột.
 * `highlight`: làm nổi bật (nền màu + chữ to hơn) cho các số liệu cần chú ý (vd công nợ).
 * `size`: cỡ chữ giá trị — "sm" (mặc định), "md" (highlight thường), "lg" (số quan trọng nhất, vd Tổng công nợ).
 */
export default function MiniStat({ label, value, color, highlight, size = highlight ? "md" : "sm" }) {
  const valueVariant = { sm: "body2", md: "subtitle1", lg: "h7" }[size];
  return (
    <Box
      sx={{
        minWidth: 0,
        ...(highlight && {
          bgcolor: "rgba(212,33,40,0.08)",
          borderRadius: 1,
          px: 0.75,
          py: 0.5,
        }),
      }}
    >
      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography
        variant={valueVariant}
        fontWeight={700}
        color={color || "text.primary"}
        noWrap
        sx={{ lineHeight: 1.3 }}
      >
        {value}
      </Typography>
    </Box>
  );
}
