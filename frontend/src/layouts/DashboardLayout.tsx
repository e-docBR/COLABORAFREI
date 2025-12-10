import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import { Sidebar } from "../components/navigation/Sidebar";
import { TopBar } from "../components/navigation/TopBar";

export const DashboardLayout = () => (
  <Box display="flex" minHeight="100vh" bgcolor="background.default">
    <Sidebar />
    <Box component="main" flex={1} p={{ xs: 2, md: 4 }}>
      <TopBar />
      <Outlet />
    </Box>
  </Box>
);
