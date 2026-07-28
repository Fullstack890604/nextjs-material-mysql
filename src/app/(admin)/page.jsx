"use client";

import { Box, Typography } from "@mui/material";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700}>
        Xin chào!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {today}
      </Typography>
    </Box>
  );
}
