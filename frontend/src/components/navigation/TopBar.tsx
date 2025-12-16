import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Typography
} from "@mui/material";
import { MouseEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

const getInitials = (value?: string) =>
  value
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FR";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coordenador: "Coordenador",
  professor: "Professor",
  aluno: "Aluno"
};

export const TopBar = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const showSearch = location.pathname !== "/app/meu-boletim";

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleChangePassword = () => {
    handleMenuClose();
    navigate("/alterar-senha");
  };
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3
      }}
    >
      {showSearch ? (
        <TextField
          placeholder="Buscar alunos, turmas…"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            sx: { backgroundColor: "background.paper", borderRadius: 999 }
          }}
        />
      ) : (
        <Box flex={1} />
      )}
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton color="inherit">
          <Badge color="error" variant="dot">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Box textAlign="right">
          <Typography variant="body2" fontWeight={600}>
            {user?.username ?? "Usuário ativo"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ROLE_LABELS[user?.role?.toLowerCase() ?? ""] ?? "Perfil padrão"}
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ cursor: "pointer" }}
          onClick={handleMenuOpen}
          aria-controls={menuOpen ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
        >
          <Avatar>{getInitials(user?.username)}</Avatar>
          <Typography variant="caption" color="text.secondary">
            Menu
          </Typography>
        </Box>
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box px={2} py={1.5}>
            <Typography variant="body2" fontWeight={600}>
              {user?.username ?? "Usuário"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role ?? "Perfil padrão"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>
            Alterar senha
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
