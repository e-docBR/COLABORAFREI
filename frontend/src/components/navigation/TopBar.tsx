import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import MenuIcon from "@mui/icons-material/Menu";
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
import { ThemeToggle } from "./ThemeToggle";

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

export const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const showSearch = !["/app", "/app/", "/app/meu-boletim", "/app/usuarios", "/app/alunos", "/app/turmas", "/app/graficos", "/app/notas", "/app/uploads", "/app/professor", "/app/ocorrencias"].includes(location.pathname);

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
        mb: 3,
        pb: 2,
        borderBottom: "1px solid",
        borderColor: "divider"
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton
          color="inherit"
          onClick={onMenuClick}
          sx={{ display: { xs: "flex", md: "none" }, ml: -1 }}
        >
          <MenuIcon />
        </IconButton>

        {showSearch && (
          <TextField
            placeholder="Buscar alunos, turmas…"
            size="small"
            sx={{ maxWidth: { xs: 200, sm: 320 }, display: { xs: "none", sm: "flex" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        )}
      </Box>

      <Box display="flex" alignItems="center" gap={2}>
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <IconButton
          color="inherit"
          size="small"
          sx={{
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "action.hover"
            }
          }}
        >
          <Badge color="error" variant="dot">
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>

        {/* User Menu */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            cursor: "pointer",
            px: { xs: 0.5, sm: 1.5 },
            py: 0.75,
            borderRadius: 1,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "action.hover"
            }
          }}
          onClick={handleMenuOpen}
          aria-controls={menuOpen ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
        >
          <Avatar
            src={user?.photo_url ? `${import.meta.env.VITE_API_BASE_URL || "/api/v1"}${user.photo_url.replace("/api/v1", "")}` : undefined}
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: "0.875rem",
              fontWeight: 700
            }}
          >
            {getInitials(user?.username)}
          </Avatar>
          <Box textAlign="left" sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
              {user?.username ?? "Usuário ativo"}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
              {ROLE_LABELS[user?.role?.toLowerCase() ?? ""] ?? "Perfil padrão"}
            </Typography>
          </Box>
        </Box>

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 1
              }
            }
          }}
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

