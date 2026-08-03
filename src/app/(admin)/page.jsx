"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid2 as Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowForward, CalendarToday, GridView, Security } from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { useMenus } from "@/context/MenuContext";
import { resolveIcon } from "@/components/MenuIcons";

const normalizePath = (path) => {
  if (!path) return null;
  return path.startsWith("/") ? path : `/${path}`;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { menus, loading } = useMenus();
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const shortcuts = useMemo(
    () => menus.filter((item) => item.path && normalizePath(item.path) !== "/").slice(0, 6),
    [menus]
  );
  const displayName = user?.description || user?.fullName || user?.username || "bạn";

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Box
        component="section"
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          color: "primary.contrastText",
          bgcolor: "primary.dark",
          backgroundImage: (theme) => `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          boxShadow: 2,
        }}
      >
        <Box aria-hidden sx={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", right: -70, top: -120, bgcolor: "rgba(255,255,255,.09)" }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ position: "relative" }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.2 }}>Tổng quan hôm nay</Typography>
            <Typography component="h1" variant="h4" sx={{ mt: 0.25 }}>Xin chào, {displayName}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25, opacity: 0.88 }}>
              <CalendarToday sx={{ fontSize: 18 }} />
              <Typography variant="body2">{today}</Typography>
            </Stack>
          </Box>
          <Chip icon={<Security />} label="Phiên làm việc an toàn" sx={{ color: "inherit", bgcolor: "rgba(255,255,255,.13)", "& .MuiChip-icon": { color: "inherit" } }} />
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={1} sx={{ mt: 4, mb: 2 }}>
        <Box>
          <Typography component="h2" variant="h6">Truy cập nhanh</Typography>
          <Typography variant="body2" color="text.secondary">Các chức năng được cấp quyền cho tài khoản của bạn.</Typography>
        </Box>
        {!loading && <Chip icon={<GridView />} label={`${menus.length} mục chức năng`} variant="outlined" />}
      </Stack>

      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}><Skeleton variant="rounded" height={132} /></Grid>
            ))
          : shortcuts.map((item) => {
              const Icon = resolveIcon(item.icon);
              const href = normalizePath(item.path);
              return (
                <Grid key={item.id ?? href} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card sx={{ height: "100%", transition: "border-color 180ms ease, box-shadow 180ms ease", "&:hover": { borderColor: "primary.light", boxShadow: 2 } }}>
                    <CardActionArea component={Link} href={href} sx={{ height: "100%", p: 0.5 }}>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 2.5, display: "grid", placeItems: "center", color: item.iconColor || "primary.main", bgcolor: (theme) => alpha(item.iconColor ? theme.palette.primary.main : theme.palette.primary.main, 0.1) }}>
                            <Icon />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography fontWeight={700}>{item.text || item.name}</Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>{href}</Typography>
                          </Box>
                          <ArrowForward color="action" fontSize="small" />
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {!loading && shortcuts.length === 0 && (
        <Card><CardContent sx={{ py: 5, textAlign: "center" }}><GridView color="disabled" sx={{ fontSize: 40 }} /><Typography sx={{ mt: 1 }} fontWeight={700}>Chưa có chức năng được gán</Typography><Typography variant="body2" color="text.secondary">Liên hệ quản trị viên để được cấp quyền truy cập.</Typography></CardContent></Card>
      )}
    </Box>
  );
}
