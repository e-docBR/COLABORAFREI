import { ChangeEvent, useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useGetNotasFiltrosQuery, useGetRelatorioQuery, useListTurmasQuery } from "../../lib/api";
import { RELATORIOS_BY_SLUG, type RelatorioSlug } from "./config";

const DEFAULT_FILTERS = { turno: "", serie: "", turma: "", disciplina: "" } as const;

const deriveSerieFromTurma = (turma?: string) => {
  if (!turma) return "";
  const parts = turma.trim().split(/\s+/);
  if (parts.length <= 1) return turma.trim();
  return parts.slice(0, -1).join(" ");
};

export const RelatorioDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: RelatorioSlug }>();
  const definition = slug ? RELATORIOS_BY_SLUG[slug] : undefined;
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const enableAdvancedFilters = definition?.slug === "melhores-alunos";
  const { data: turmasData } = useListTurmasQuery(undefined, {
    skip: !enableAdvancedFilters
  });
  const { data: notasFiltrosData } = useGetNotasFiltrosQuery(undefined, {
    skip: !enableAdvancedFilters
  });

  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [slug]);

  const turmasList = useMemo(() => turmasData?.items ?? [], [turmasData]);

  const turnoOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const set = new Set<string>();
    turmasList.forEach((item) => {
      if (item.turno) {
        set.add(item.turno);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, turmasList]);

  const serieOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const set = new Set<string>();
    turmasList.forEach((item) => {
      const serie = deriveSerieFromTurma(item.turma);
      if (serie) {
        set.add(serie);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, turmasList]);

  const turmaOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const filtered = turmasList.filter((item) => {
      const matchesTurno = !filters.turno || item.turno === filters.turno;
      const matchesSerie = !filters.serie || deriveSerieFromTurma(item.turma) === filters.serie;
      return matchesTurno && matchesSerie;
    });
    const set = new Set(filtered.map((item) => item.turma));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, filters.serie, filters.turno, turmasList]);

  useEffect(() => {
    if (!enableAdvancedFilters || !filters.turma) return;
    if (!turmaOptions.includes(filters.turma)) {
      setFilters((prev) => ({ ...prev, turma: "" }));
    }
  }, [enableAdvancedFilters, filters.turma, turmaOptions]);

  const disciplinaOptions = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const disciplinas = notasFiltrosData?.disciplinas ?? [];
    return [...disciplinas].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [enableAdvancedFilters, notasFiltrosData]);

  const sanitizedFilters = useMemo(
    () => ({
      turno: filters.turno || undefined,
      serie: filters.serie || undefined,
      turma: filters.turma || undefined,
      disciplina: filters.disciplina || undefined
    }),
    [filters]
  );

  const queryArgs = slug
    ? {
        slug,
        ...sanitizedFilters
      }
    : undefined;

  const { data, isLoading, isError, isFetching } = useGetRelatorioQuery(queryArgs ?? { slug: "" }, {
    skip: !slug || !definition || !queryArgs
  });

  if (!definition) {
    return <Alert severity="warning">Relatório não encontrado.</Alert>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Não foi possível carregar os dados deste relatório.</Alert>;
  }

  const rows = Array.isArray(data.dados) ? data.dados : [];
  const hasRows = rows.length > 0;

  const combinationIssues = useMemo(() => {
    if (!enableAdvancedFilters) return [];
    const issues: string[] = [];
    if (filters.turma) {
      if (filters.serie && !filters.turma.toUpperCase().startsWith(filters.serie.toUpperCase())) {
        issues.push("A turma selecionada não pertence à série escolhida.");
      }
      const matchingTurmas = turmasList.filter((item) => item.turma === filters.turma);
      if (filters.turno && matchingTurmas.length && !matchingTurmas.some((item) => item.turno === filters.turno)) {
        issues.push("A turma selecionada não está disponível no turno informado.");
      }
    }
    return issues;
  }, [enableAdvancedFilters, filters.serie, filters.turma, filters.turno, turmasList]);

  const handleFilterChange = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => {
      let next = {
        ...prev,
        [field]: value,
        ...(field === "serie" ? { turma: "" } : {})
      };
      if (field === "turma") {
        if (!value) {
          next = { ...next, turma: "" };
        } else {
          const derivedSerie = deriveSerieFromTurma(value);
          const match = turmasList.find((item) => item.turma === value);
          next = {
            ...next,
            turma: value,
            serie: derivedSerie || next.serie,
            turno: match?.turno ?? next.turno
          };
        }
      }
      return next;
    });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Breadcrumbs>
          <Link component={RouterLink} to="/relatorios" underline="hover">
            Relatórios
          </Link>
          <Typography color="text.primary">{definition.title}</Typography>
        </Breadcrumbs>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={600}>
            {definition.title}
          </Typography>
          <Typography color="text.secondary">{definition.description}</Typography>
        </CardContent>
      </Card>

      {enableAdvancedFilters && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
              <TextField
                select
                label="Turno"
                value={filters.turno}
                onChange={handleFilterChange("turno")}
                fullWidth
              >
                <MenuItem value="">Todos os turnos</MenuItem>
                {turnoOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Série"
                value={filters.serie}
                onChange={handleFilterChange("serie")}
                fullWidth
              >
                <MenuItem value="">Todas as séries</MenuItem>
                {serieOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Turma"
                value={filters.turma}
                onChange={handleFilterChange("turma")}
                disabled={turmaOptions.length === 0}
                fullWidth
              >
                <MenuItem value="">Todas as turmas</MenuItem>
                {turmaOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Disciplina"
                value={filters.disciplina}
                onChange={handleFilterChange("disciplina")}
                disabled={disciplinaOptions.length === 0}
                fullWidth
              >
                <MenuItem value="">Todas as disciplinas</MenuItem>
                {disciplinaOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            {combinationIssues.length > 0 && (
              <Box mt={2}>
                <Alert severity="warning" sx={{ mb: 0 }}>
                  {combinationIssues[0]}
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              {definition.columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!hasRows && !isFetching ? (
              <TableRow>
                <TableCell colSpan={definition.columns.length} align="center">
                  <Typography color="text.secondary">Nenhum dado disponível.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${definition.slug}-${index}`} hover>
                  {definition.columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {isFetching && (
              <TableRow>
                <TableCell colSpan={definition.columns.length} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};
