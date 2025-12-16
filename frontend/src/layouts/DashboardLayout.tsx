import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import { Sidebar } from "../components/navigation/Sidebar";
import { TopBar } from "../components/navigation/TopBar";
import { useAppSelector } from "../app/hooks";
import { Navigate, useLocation } from "react-router-dom";

export const DashboardLayout = () => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  if (user?.must_change_password) {
    return <Navigate to="/alterar-senha" state={{ from: location }} replace />;
  }
  if (user?.role === "aluno" && location.pathname !== "/app/meu-boletim") {
    return <Navigate to="/app/meu-boletim" replace />;
  }
  return (
    <Box display="flex" minHeight="100vh" bgcolor="background.default">
      <Sidebar />
      <Box component="main" flex={1} p={{ xs: 2, md: 4 }}>
        <TopBar />
        <Outlet />
      </Box>
    </Box>
  );
};
