import { Box, Card, CardContent, Typography } from "@mui/material";

export default function ReportsPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" fontWeight={700}>
        Báo cáo
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Thống kê và báo cáo dữ liệu từ hệ thống.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
