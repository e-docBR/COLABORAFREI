import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import { Avatar, Badge, Box, IconButton, InputAdornment, TextField, Typography } from "@mui/material";

import { useAppSelector } from "../../app/hooks";

const getInitials = (value?: string) =>
  value
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FR";

export const TopBar = () => {
  const user = useAppSelector((state) => state.auth.user);

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
            {user?.role ?? "Perfil padrão"}
          </Typography>
        </Box>
        <Avatar>{getInitials(user?.username)}</Avatar>
      </Box>
    </Box>
  );
};
