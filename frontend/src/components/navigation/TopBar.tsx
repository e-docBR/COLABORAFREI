import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
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
import { logout, updateUser } from "../../features/auth/authSlice";
import { useUploadPhotoMutation } from "../../lib/api";

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
  const showSearch = !["/app/meu-boletim", "/app/usuarios", "/app/alunos", "/app/turmas", "/app/graficos", "/app/notas", "/app/uploads"].includes(location.pathname);
  const [uploadPhoto] = useUploadPhotoMutation();

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleChangePassword = () => {
    handleMenuClose();
    navigate("/alterar-senha");
  };
  const handleLogout = () => {
    handleMenuClose();
    const targetUrl = user?.role === "aluno" ? "/login?perfil=aluno" : "/login";
    dispatch(logout());
    navigate(targetUrl, { replace: true });
  };

  const handleAddPhoto = () => {
    handleMenuClose();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const { photo_url } = await uploadPhoto(formData).unwrap();
          if (user) {
            dispatch(updateUser({ ...user, photo_url }));
          }
        } catch (error) {
          console.error("Failed to upload photo", error);
        }
      }
    };
    input.click();
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
          <Avatar src={user?.photo_url ? `${import.meta.env.VITE_API_BASE_URL || "/api/v1"}${user.photo_url.replace("/api/v1", "")}` : undefined}>
            {getInitials(user?.username)}
          </Avatar>
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
          <MenuItem onClick={handleAddPhoto}>
            <ListItemIcon>
              <AddAPhotoIcon fontSize="small" />
            </ListItemIcon>
            Acrescentar foto
          </MenuItem>
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
