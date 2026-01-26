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

import { useListAlunosQuery, useListTurmasQuery } from "../../lib/api";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FR";

const getMediaColor = (media?: number | null): "default" | "success" | "warning" | "error" => {
  if (media === undefined || media === null) return "default";
  // Support both 0-20 and 0-100 scales
  const isLargeScale = media > 20;
  if (isLargeScale) {
    if (media >= 70) return "success";
    if (media < 50) return "error";
    return "warning";
  }
  if (media >= 15) return "success";
  if (media < 12) return "error";
  return "warning";
};


export const AlunosPage = () => {
  const [search, setSearch] = useState("");
  const [turno, setTurno] = useState("");
  const [turma, setTurma] = useState("");

  const {
    data: turmasData,
    isFetching: isFetchingTurmas
  } = useListTurmasQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });

  const turnoOptions = useMemo(() => {
    const items = turmasData?.items ?? [];
    const turnos = new Set<string>();
    items.forEach((item) => {
      if (item.turno) turnos.add(item.turno);
    });
    return Array.from(turnos).sort();
  }, [turmasData]);

  const turmaOptions = useMemo(() => {
    const items = turmasData?.items ?? [];
    return items.map((t) => t.turma).sort();
  }, [turmasData]);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (turno) params.turno = turno;
    if (turma) params.turma = turma;
    return params;
  }, [turno, turma]);

  const { data, isLoading, isError } = useListAlunosQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });

  const alunos = data?.items ?? [];

  const filteredAlunos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return alunos;
    return alunos.filter((aluno) =>
      aluno.nome?.toLowerCase().includes(term) ||
      aluno.turma?.toLowerCase().includes(term)
    );
  }, [alunos, search]);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Box mb={3}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            letterSpacing: "-0.02em",
            color: "text.primary",
            mb: 0.5
          }}
        >
          Alunos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestão de estudantes e desempenho acadêmico
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
        <TextField
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Turno"
          value={turno}
          onChange={(e) => setTurno(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
          SelectProps={{ native: true }}
        >
          <option value="">Todos</option>
          {turnoOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </TextField>
        <TextField
          select
          label="Turma"
          value={turma}
          onChange={(e) => setTurma(e.target.value)}
          size="small"
          sx={{ minWidth: 140 }}
          SelectProps={{ native: true }}
        >
          <option value="">Todas</option>
          {turmaOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </TextField>
        {(search || turno || turma) && (
          <Button
            variant="outlined"
            onClick={() => {
              setSearch("");
              setTurno("");
              setTurma("");
            }}
            size="small"
          >
            Limpar
          </Button>
        )}
      </Stack>

      {isError && <Alert severity="error" sx={{ mb: 3 }}>Erro ao carregar alunos</Alert>}

      <Grid container spacing={2}>
        {isLoading || isFetchingTurmas ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />
            </Grid>
          ))
        ) : filteredAlunos.length === 0 ? (
          <Grid size={12}>
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary">Nenhum aluno encontrado</Typography>
            </Box>
          </Grid>
        ) : (
          filteredAlunos.map((aluno) => (
            <Grid key={aluno.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 1
                  }
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/app/alunos/${aluno.id}`}
                  sx={{ height: "100%" }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          width: 40,
                          height: 40,
                          fontSize: "0.875rem",
                          fontWeight: 700
                        }}
                      >
                        {getInitials(aluno.nome ?? "")}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontSize="0.875rem"
                          noWrap
                          mb={0.25}
                        >
                          {aluno.nome}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontSize="0.75rem"
                          color="text.secondary"
                          noWrap
                        >
                          {aluno.turma}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={aluno.media !== null && aluno.media !== undefined
                          ? `Média: ${aluno.media.toFixed(1)}`
                          : "Sem média"}
                        size="small"
                        color={getMediaColor(aluno.media)}

                        sx={{
                          height: 20,
                          fontSize: "0.625rem",
                          fontWeight: 600
                        }}
                      />
                      {aluno.faltas !== null && aluno.faltas !== undefined && aluno.faltas > 0 && (
                        <Chip
                          label={`${aluno.faltas} faltas`}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: "0.625rem"
                          }}
                        />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};
