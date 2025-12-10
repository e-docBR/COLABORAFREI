import { useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";

import { tokens } from "./tokens";

const buildTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary
      },
      secondary: {
        main: tokens.secondary
      },
      background: {
        default: mode === "light" ? "#f4f7fb" : "#0f1219",
        paper: mode === "light" ? "#ffffff" : "#141925"
      }
    },
    typography: {
      fontFamily: "Space Grotesk, 'Segoe UI', sans-serif",
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 }
    },
    shape: {
      borderRadius: 16
    }
  });

export const useAppTheme = () => {
  const [mode] = useState<"light" | "dark">("light");
  const theme = useMemo(() => buildTheme(mode), [mode]);
  return { theme, mode };
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppTheme();
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};
