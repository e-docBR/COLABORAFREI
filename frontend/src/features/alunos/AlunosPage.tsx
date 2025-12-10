import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid2 as Grid,
  Skeleton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useListAlunosQuery } from "../../lib/api";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FR";

const getMediaColor = (media?: number | null): "default" | "success" | "warning" | "error" => {
  if (media === undefined || media === null) return "default";
  if (media >= 15) return "success";
  if (media < 12) return "error";
  return "warning";
};

export const AlunosPage = () => {
  const [search, setSearch] = useState("");
  const [turno, setTurno] = useState("");
  const [turma, setTurma] = useState("");

  const filters = useMemo(
    () => ({
      q: search.trim() || undefined,
      turno: turno || undefined,
      turma: turma || undefined
    }),
    [search, turno, turma]
  );

  const { data, isFetching, isError } = useListAlunosQuery(filters);
  const alunos = data?.items ?? [];

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        <TextField
          label="Nome ou matrícula"
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <TextField
          label="Turno"
          select
          SelectProps={{ native: true }}
          value={turno}
          onChange={(event) => setTurno(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="Matutino">Matutino</option>
          <option value="Vespertino">Vespertino</option>
          <option value="Noturno">Noturno</option>
        </TextField>
        <TextField
          label="Turma"
          select
          SelectProps={{ native: true }}
          value={turma}
          onChange={(event) => setTurma(event.target.value)}
        >
          <option value="">Todas</option>
          <option value="6º A">6º A</option>
          <option value="7º B">7º B</option>
          <option value="8º C">8º C</option>
        </TextField>
        <Button variant="contained" color="primary">
          Novo Aluno
        </Button>
      </Stack>

      {isError && <Alert severity="error">Não foi possível carregar a lista de alunos.</Alert>}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" mb={2}>
            <Typography variant="h6">{`Alunos (${data?.meta.total ?? 0})`}</Typography>
            <Typography variant="body2" color="text.secondary">
              Página {data?.meta.page ?? 1} · {data?.meta.per_page ?? 20} por página
            </Typography>
          </Stack>

          {isFetching && !alunos.length ? (
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid key={index} size={{ xs: 12, md: 6, lg: 3 }}>
                  <Skeleton variant="rounded" height={160} />
                </Grid>
              ))}
            </Grid>
          ) : alunos.length ? (
            <Grid container spacing={2}>
              {alunos.map((aluno) => (
                <Grid key={aluno.id} size={{ xs: 12, md: 6, lg: 3 }}>
                  <Card variant="outlined" sx={{ borderRadius: 4, height: "100%" }}>
                    <CardActionArea component={RouterLink} to={`/alunos/${aluno.id}`} sx={{ height: "100%" }}>
                      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Avatar>{getInitials(aluno.nome)}</Avatar>
                          <Box>
                            <Typography fontWeight={600}>{aluno.nome}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {aluno.turma} • {aluno.turno}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Matrícula: {aluno.matricula}
                        </Typography>
                        <Chip
                          label={
                            aluno.media !== undefined && aluno.media !== null
                              ? `Média ${aluno.media.toFixed(1)}`
                              : "Sem média"
                          }
                          color={getMediaColor(aluno.media)}
                          size="small"
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" color="text.secondary">
                Nenhum aluno encontrado para os filtros selecionados.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
