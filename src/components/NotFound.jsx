import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";
import { MedicalServices, HomeOutlined } from "@mui/icons-material";

const BRAND_RED = "#D42128";
const BRAND_NAVY = "#1B2A5C";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={2.5} alignItems="center" textAlign="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: BRAND_RED,
            color: "#fff",
          }}
        >
          <MedicalServices sx={{ fontSize: 28 }} />
        </Box>

        <Typography
          variant="h1"
          sx={{ fontSize: { xs: 80, sm: 112 }, fontWeight: 900, lineHeight: 1, color: BRAND_NAVY }}
        >
          404
        </Typography>

        <Typography variant="h6" fontWeight={700}>
          Trang bạn tìm không tồn tại
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
          Đường dẫn có thể đã bị thay đổi, bị xóa hoặc chưa được cấu hình.
        </Typography>

        <Button
          component={Link}
          href="/"
          variant="contained"
          startIcon={<HomeOutlined />}
          sx={{ mt: 1, px: 3 }}
        >
          Về trang chủ
        </Button>
      </Stack>
    </Box>
  );
}
