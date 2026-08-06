"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "@/theme";
import { DEFAULT_THEME_KEY, themeOptions, themePresets } from "@/themePresets";

const ThemeSelectionContext = createContext(null);

export function useThemeSelection() {
  const context = useContext(ThemeSelectionContext);
  if (!context) throw new Error("useThemeSelection must be used within AppThemeProvider");
  return context;
}

export default function AppThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("app-theme");
    if (savedTheme && themeOptions.some((option) => option.key === savedTheme)) setThemeKey(savedTheme);
    setHydrated(true);
  }, []);

  const selectTheme = (nextTheme) => {
    if (!themePresets[nextTheme]) return;
    setThemeKey(nextTheme);
    window.localStorage.setItem("app-theme", nextTheme);
  };

  const theme = useMemo(() => createAppTheme(themePresets[themeKey]), [themeKey]);

  if (!hydrated) {
    return <div style={{ minHeight: "100vh", background: "#F8FAFC" }} />;
  }

  return (
    <ThemeSelectionContext.Provider value={{ themeKey, selectTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeSelectionContext.Provider>
  );
}
