import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import { Sidebar } from "../components/navigation/Sidebar";
import { TopBar } from "../components/navigation/TopBar";
import { useAppSelector } from "../app/hooks";
import { Navigate, useLocation } from "react-router-dom";

import { ChatWidget } from "../features/ai-chat/ChatWidget";

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
      {/* Only show Chat for non-students (staff) or if we want students to have it too? 
          The requirement said "coordenadores e direção", so let's check permission or just show for now.
          The user requirement said "Data Chatbot" for natural language querying of school data. Usually for staff.
          Let's restrict to non-students for now to be safe, or just show it if `user` exists.
          Let's show it for everyone except maybe students if we want to follow the "staff dashboard" logic.
          But let's stick to showing it for now, can refine if needed.
       */}
      {user?.role !== "aluno" && <ChatWidget />}
    </Box>
  );
};
