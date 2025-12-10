import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";
import { useLoginMutation } from "../../lib/api";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();

  const resolveErrorMessage = (err: unknown) => {
    if (err && typeof err === "object" && "data" in err) {
      const data = (err as FetchBaseQueryError).data;
      if (typeof data === "string") return data;
      if (data && typeof data === "object" && "error" in data) {
        return String((data as { error?: string }).error || "Falha no login");
      }
    }
    return err instanceof Error ? err.message : "Falha no login";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await login({ username, password }).unwrap();
      dispatch(setCredentials(response));
      navigate("/");
    } catch (err) {
      setError(resolveErrorMessage(err));
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      px={2}
    >
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 6 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={600} mb={1}>
            Boletins Frei
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Entre com suas credenciais para acessar dashboards, relatórios e gestão de notas.
          </Typography>
          <Stack component="form" gap={2} onSubmit={handleSubmit}>
            <TextField
              label="Usuário"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              label="Senha"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            <Button type="submit" variant="contained" size="large" disabled={isLoading}>
              {isLoading ? "Entrando…" : "Entrar"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
