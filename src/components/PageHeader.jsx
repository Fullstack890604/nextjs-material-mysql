"use client";

import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * Tiêu đề trang dùng chung: tiêu đề + mô tả (tùy chọn icon) và vùng nút hành động.
 *
 * @param {string} title       Tiêu đề chính
 * @param {string} [subtitle]  Mô tả phụ
 * @param {React.ReactNode} [icon]     Icon hiển thị trong khung bên trái tiêu đề
 * @param {React.ReactNode} [actions]  Các nút hành động bên phải
 */
export default function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {icon ? (
          // Có icon: đặt trong khung bo tròn nền nhạt
          <Box
            sx={{
              width: 46,
              height: 46,
              flexShrink: 0,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            }}
          >
            {icon}
          </Box>
        ) : (
          // Không icon: thanh nhấn dọc màu primary
          <Box
            sx={{
              width: 4,
              alignSelf: "stretch",
              minHeight: 38,
              borderRadius: 1,
              flexShrink: 0,
              background: (t) =>
                `linear-gradient(180deg, ${t.palette.primary.main}, ${t.palette.primary.light})`,
            }}
          />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {actions && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
