import { Avatar, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import PeopleIcon from "@mui/icons-material/People";
import ClassIcon from "@mui/icons-material/Class";
import ArticleIcon from "@mui/icons-material/Article";
import InsightsIcon from "@mui/icons-material/Insights";
import TableViewIcon from "@mui/icons-material/TableView";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { label: "Alunos", icon: <PeopleIcon />, path: "/alunos" },
  { label: "Turmas", icon: <ClassIcon />, path: "/turmas" },
  { label: "Notas", icon: <TableViewIcon />, path: "/notas" },
  { label: "Gráficos", icon: <InsightsIcon />, path: "/graficos" },
  { label: "Relatórios", icon: <ArticleIcon />, path: "/relatorios" },
  { label: "Uploads", icon: <UploadFileIcon />, path: "/uploads" }
];

export const Sidebar = () => (
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
      {navItems.map((item) => (
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
