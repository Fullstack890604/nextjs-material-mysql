import { Box, Card, CardContent, Typography } from "@mui/material";

export default function SettingsPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" fontWeight={700}>
        Cài đặt
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Cấu hình hệ thống và thông tin phòng khám sẽ hiển thị ở đây.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
