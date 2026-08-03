"use client";

import { createTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { palette } from "@/palette";

const theme = createTheme({
  palette,
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Fira Sans", "Roboto", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.035em" },
    h2: { fontWeight: 700, letterSpacing: "-0.03em" },
    h3: { fontWeight: 700, letterSpacing: "-0.025em" },
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 700 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    button: { fontWeight: 700, textTransform: "none", letterSpacing: 0 },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(15, 23, 42, 0.05)",
    "0 4px 16px rgba(15, 23, 42, 0.07)",
    "0 8px 28px rgba(15, 23, 42, 0.09)",
    ...Array(21).fill("0 12px 36px rgba(15, 23, 42, 0.12)"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320 },
        "*": { boxSizing: "border-box" },
        "::selection": { backgroundColor: alpha(palette.primary.main, 0.2) },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: "medium" },
      styleOverrides: {
        root: { minHeight: 36, borderRadius: 6, paddingInline: 16, textTransform: "uppercase" },
        contained: { boxShadow: `0 5px 14px ${alpha(palette.primary.main, 0.2)}` },
      },
    },
    MuiIconButton: {
      defaultProps: { size: "medium" },
      styleOverrides: { root: { minWidth: 40, minHeight: 40, borderRadius: "50% !important" } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 6,
          transition: "background-color 180ms ease, color 180ms ease",
          "&.Mui-selected": {
            color: palette.primary.dark,
            backgroundColor: alpha(palette.primary.main, 0.11),
          },
          "&.Mui-selected:hover": { backgroundColor: alpha(palette.primary.main, 0.16) },
        },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44 } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${palette.divider}`,
          backgroundImage: "none",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.045)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 44,
          transition: "background-color 180ms ease, box-shadow 180ms ease",
          "&.Mui-focused": { boxShadow: `0 0 0 3px ${alpha(palette.primary.main, 0.14)}` },
        },
        notchedOutline: { borderColor: palette.divider },
      },
    },
    MuiTableHead: {
      styleOverrides: { root: { backgroundColor: "#F1F5F9" } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: palette.divider },
        head: { color: palette.text.primary, fontWeight: 700, whiteSpace: "nowrap" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: "1px solid rgba(0, 0, 0, 0.12)",
          borderRadius: 8,
        },
      },
    },
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 500 } },
  },
});

export default theme;
