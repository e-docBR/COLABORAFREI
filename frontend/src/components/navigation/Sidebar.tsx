import { Avatar, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import PeopleIcon from "@mui/icons-material/People";
import ClassIcon from "@mui/icons-material/Class";
import ArticleIcon from "@mui/icons-material/Article";
import InsightsIcon from "@mui/icons-material/Insights";
import TableViewIcon from "@mui/icons-material/TableView";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { useAppSelector } from "../../app/hooks";

const appBasePath = "/app";

const staffNavItems = [
  { label: "Dashboard", icon: <DashboardIcon />, path: appBasePath },
  { label: "Alunos", icon: <PeopleIcon />, path: `${appBasePath}/alunos` },
  { label: "Turmas", icon: <ClassIcon />, path: `${appBasePath}/turmas` },
  { label: "Notas", icon: <TableViewIcon />, path: `${appBasePath}/notas` },
  { label: "Gráficos", icon: <InsightsIcon />, path: `${appBasePath}/graficos` },
  { label: "Relatórios", icon: <ArticleIcon />, path: `${appBasePath}/relatorios` }
];

const alunoNavItems = [{ label: "Meu Boletim", icon: <PeopleIcon />, path: `${appBasePath}/meu-boletim` }];

export const Sidebar = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAluno = user?.role === "aluno";
  const isAdmin = Boolean(user?.is_admin || user?.role === "admin");
  const items = useMemo(() => {
    if (isAluno) return alunoNavItems;
    const base = [...staffNavItems];
    if (isAdmin) {
      base.splice(1, 0, { label: "Usuários", icon: <ManageAccountsIcon />, path: `${appBasePath}/usuarios` });
      base.push({ label: "Uploads", icon: <UploadFileIcon />, path: `${appBasePath}/uploads` });
    }
    // Add Professor Dashboard for admin or professor
    if (isAdmin || user?.role === "professor") {
      base.push({ label: "Visão Professor", icon: <InsightsIcon />, path: `${appBasePath}/professor` });
    }
    // Add Comunicados for everyone (Staff manages, Students read - but students have different list)
    // Actually, students have it in MeuBoletim? No, implementation plan says "Aba/Seção" there, but let's make it consistent.
    // If student, add to their list. If staff, add to theirs.

    // For staff:
    base.splice(1, 0, { label: "Comunicados", icon: <NotificationsIcon />, path: `${appBasePath}/comunicados` });
    base.splice(2, 0, { label: "Ocorrências", icon: <WarningAmberIcon />, path: `${appBasePath}/ocorrencias` });

    return base;
  }, [isAluno, isAdmin]);
  return (
    <Box
      component="aside"
      sx={{
        width: 280,
        flexShrink: 0,
        minHeight: "100vh",
        borderRight: 1,
        borderColor: "divider",
        background: "linear-gradient(180deg, #050d22 0%, #0f1f3d 100%)",
        color: "white",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        p: 3
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Avatar sx={{ bgcolor: "#0bd0ff" }}>FR</Avatar>
        <Box>
          <Typography fontWeight={600}>Colégio Frei Ronaldo</Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.7)">Boletins Inteligentes</Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.active": { backgroundColor: "rgba(255,255,255,0.08)" }
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 2 }} />
      <Box>
        <Typography variant="caption" color="rgba(255,255,255,0.6)">
          v2.0.0 — 2025
        </Typography>
      </Box>
    </Box>
  );
};
