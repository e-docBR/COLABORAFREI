import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Card, CardContent, Stack, TextField, InputAdornment, Alert, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { useListNotasQuery } from "../../lib/api";

const gradeFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? `${numberValue}` : numberValue.toFixed(1);
};

const columns: GridColDef[] = [
  { field: "aluno", headerName: "Aluno", flex: 1, minWidth: 220 },
  { field: "disciplina", headerName: "Disciplina", flex: 1, minWidth: 180 },
  {
    field: "t1",
    headerName: "T1",
    width: 90,
    valueFormatter: (params: { value?: number | null }) => gradeFormatter(params?.value ?? null)
  },
  {
    field: "t2",
    headerName: "T2",
    width: 90,
    valueFormatter: (params: { value?: number | null }) => gradeFormatter(params?.value ?? null)
  },
  {
    field: "t3",
    headerName: "T3",
    width: 90,
    valueFormatter: (params: { value?: number | null }) => gradeFormatter(params?.value ?? null)
  },
  {
    field: "total",
    headerName: "Total",
    width: 110,
    valueFormatter: (params: { value?: number | null }) => gradeFormatter(params?.value ?? null)
  },
  {
    field: "faltas",
    headerName: "Faltas",
    width: 110,
    valueFormatter: (params: { value?: number | null }) => {
      const value = params?.value;
      return value === null || value === undefined ? "—" : `${value}`;
    }
  }
];

const EmptyState = () => (
  <Box height="100%" display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={1}>
    <Typography fontWeight={600}>Nenhuma nota encontrada</Typography>
    <Typography variant="body2" color="text.secondary">
      Ajuste os filtros ou tente outra busca.
    </Typography>
  </Box>
);

export const NotasPage = () => {
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") ?? "";
  });
  const [turma, setTurma] = useState(() => new URLSearchParams(window.location.search).get("turma") ?? "");
  const [disciplina, setDisciplina] = useState(() => new URLSearchParams(window.location.search).get("disciplina") ?? "");
  const [turno, setTurno] = useState(() => new URLSearchParams(window.location.search).get("turno") ?? "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (turma) params.set("turma", turma);
    if (disciplina) params.set("disciplina", disciplina);
    if (turno) params.set("turno", turno);
    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [search, turma, disciplina, turno]);

  const queryFilters = useMemo(
    () => ({
      turma: turma || undefined,
      disciplina: disciplina || undefined,
      turno: turno || undefined
    }),
    [turma, disciplina, turno]
  );

  const { data, isFetching, isError } = useListNotasQuery(queryFilters);
  const notas = data?.items ?? [];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredNotas = useMemo(() => {
    if (!normalizedSearch) return notas;
    return notas.filter((nota) => {
      const tokens = [nota.aluno?.nome, nota.aluno?.turma, nota.disciplina];
      return tokens.some((token) => token?.toLowerCase().includes(normalizedSearch));
    });
  }, [normalizedSearch, notas]);

  const rows = filteredNotas.map((nota) => ({
    id: `${nota.aluno?.id ?? "na"}-${nota.disciplina}`,
    aluno: `${nota.aluno?.nome ?? "Aluno sem nome"}${nota.aluno?.turma ? ` · ${nota.aluno.turma}` : ""}`,
    disciplina: nota.disciplina,
    t1: nota.trimestre1 ?? null,
    t2: nota.trimestre2 ?? null,
    t3: nota.trimestre3 ?? null,
    total: nota.total ?? null,
    faltas: nota.faltas ?? null
  }));

  const turmaOptions = useMemo(
    () => Array.from(new Set(notas.map((nota) => nota.aluno?.turma).filter((value): value is string => Boolean(value)))).sort(),
    [notas]
  );
  const disciplinaOptions = useMemo(
    () => Array.from(new Set(notas.map((nota) => nota.disciplina).filter(Boolean))).sort(),
    [notas]
  );
  const turnoOptions = useMemo(
    () => Array.from(new Set(notas.map((nota) => nota.aluno?.turno).filter((value): value is string => Boolean(value)))).sort(),
    [notas]
  );

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Stack direction={{ xs: "column", lg: "row" }} gap={2} flexWrap="wrap">
        <TextField
          placeholder="Buscar alunos, turmas..."
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} flex={1} minWidth={{ lg: 420 }}>
          <TextField
            label="Turma"
            select
            SelectProps={{ native: true }}
            value={turma}
            onChange={(event) => setTurma(event.target.value)}
            fullWidth
          >
            <option value="">Todas</option>
            {turmaOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
          <TextField
            label="Disciplina"
            select
            SelectProps={{ native: true }}
            value={disciplina}
            onChange={(event) => setDisciplina(event.target.value)}
            fullWidth
          >
            <option value="">Todas</option>
            {disciplinaOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
          <TextField
            label="Turno"
            select
            SelectProps={{ native: true }}
            value={turno}
            onChange={(event) => setTurno(event.target.value)}
            fullWidth
          >
            <option value="">Todos</option>
            {turnoOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
        </Stack>
      </Stack>

      {isError && <Alert severity="error">Não foi possível carregar as notas.</Alert>}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} mb={2} gap={1}>
            <Typography variant="h6">Notas dos alunos</Typography>
            <Typography variant="body2" color="text.secondary">
              Exibindo {filteredNotas.length} de {data?.total ?? filteredNotas.length} registros
            </Typography>
          </Stack>
          <Box height={520}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableColumnMenu
              disableRowSelectionOnClick
              loading={isFetching}
              slots={{ noRowsOverlay: EmptyState }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 100 }
                }
              }}
              pageSizeOptions={[25, 50, 100]}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "grey.50",
                  borderRadius: 2,
                  color: "text.secondary",
                  fontSize: 14
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid",
                  borderBottomColor: "grey.100"
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
