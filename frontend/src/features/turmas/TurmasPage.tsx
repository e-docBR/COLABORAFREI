import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid2 as Grid,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useListTurmasQuery } from "../../lib/api";

const progressFromMedia = (media?: number | null) => {
  if (media === undefined || media === null) return 0;
  return Math.min(100, Math.max(0, (media / 20) * 100));
};

export const TurmasPage = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useListTurmasQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });
  const turmas = data?.items ?? [];
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return turmas;
    return turmas.filter((turma) =>
      [turma.turma, turma.turno].some((value) => (value ?? "").toLowerCase().includes(term))
    );
  }, [turmas, search]);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <TextField
        placeholder="Buscar turmas..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        fullWidth
      />

      {isError && <Alert severity="error">Não foi possível carregar as turmas.</Alert>}

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, md: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length ? (
        <Grid container spacing={2}>
          {filtered.map((turma) => (
            <Grid key={`${turma.turma}-${turma.turno}`} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ borderRadius: 4 }}>
                <CardActionArea onClick={() => navigate(`/turmas/${encodeURIComponent(turma.slug ?? turma.turma)}`)}>
                  <CardContent>
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{turma.turma}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {turma.turno} • {turma.total_alunos} alunos
                    </Typography>
                  </Stack>
                  <Stack mt={2} spacing={0.5}>
                    <Typography fontWeight={600}>
                      Média {turma.media?.toFixed(1) ?? "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taxa estimada (média / 20)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progressFromMedia(turma.media)}
                      sx={{ borderRadius: 999, height: 8 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Faltas médias: {turma.faltas_medias ?? 0}
                    </Typography>
                  </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">Nenhuma turma encontrada para o filtro.</Typography>
        </Box>
      )}
    </Box>
  );
};
