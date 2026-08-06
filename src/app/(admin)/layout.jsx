"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { MenuProvider } from "@/context/MenuContext";
import { SearchProvider } from "@/context/SearchContext";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import Breadcrumbs from "@/components/Breadcrumbs";
import RouteGuard from "@/components/RouteGuard";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), {
    noSsr: true,
  });
  const [collapsed, setCollapsed] = useState(false); // thu gọn trên desktop
  const [mobileOpen, setMobileOpen] = useState(false); // drawer trên mobile

  // Đóng drawer sau khi điều hướng trên mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MenuProvider>
      <SearchProvider>
        <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden", bgcolor: "background.default" }}>
          <Box
            component="a"
            href="#main-content"
            sx={{
              position: "fixed",
              zIndex: 2000,
              top: 8,
              left: 8,
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: "primary.dark",
              color: "primary.contrastText",
              textDecoration: "none",
              transform: "translateY(-150%)",
              "&:focus": { transform: "translateY(0)" },
            }}
          >
            Bỏ qua điều hướng
          </Box>
          {isMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{ "& .MuiDrawer-paper": { border: 0 } }}
            >
              <Sidebar collapsed={false} />
            </Drawer>
          ) : (
            <Sidebar collapsed={collapsed} />
          )}
          <Box sx={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
            <TopNav
              sidebarOpen={isMobile ? mobileOpen : !collapsed}
              onToggleSidebar={() =>
                isMobile
                  ? setMobileOpen((o) => !o)
                  : setCollapsed((c) => !c)
              }
            />
            <Breadcrumbs />
            <Box
              component="main"
              id="main-content"
              tabIndex={-1}
              sx={{
                flex: 1,
                overflowY: "auto",
                p: { xs: 2, sm: 2.5, lg: 3 },
                scrollBehavior: "smooth",
              }}
            >
              <RouteGuard>{children}</RouteGuard>
            </Box>
          </Box>
        </Box>
      </SearchProvider>
    </MenuProvider>
  );
}
