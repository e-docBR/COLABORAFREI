import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Card, CardContent, Stack, TextField } from "@mui/material";

const columns: GridColDef[] = [
  { field: "aluno", headerName: "Aluno", flex: 1 },
  { field: "disciplina", headerName: "Disciplina", flex: 1 },
  { field: "t1", headerName: "T1", width: 90 },
  { field: "t2", headerName: "T2", width: 90 },
  { field: "t3", headerName: "T3", width: 90 },
  { field: "total", headerName: "Total", width: 110 },
  { field: "faltas", headerName: "Faltas", width: 100 }
];

const rows = [
  {
    id: 1,
    aluno: "Carlos Silva",
    disciplina: "Matemática",
    t1: 14,
    t2: 16,
    t3: 17,
    total: 47,
    faltas: 2
  }
];

export const NotasPage = () => (
  <Box display="flex" flexDirection="column" gap={3}>
    <Stack direction={{ xs: "column", md: "row" }} gap={2}>
      <TextField label="Turma" fullWidth />
      <TextField label="Disciplina" fullWidth />
      <TextField label="Turno" fullWidth />
    </Stack>
    <Card>
      <CardContent>
        <Box height={420}>
          <DataGrid rows={rows} columns={columns} disableColumnMenu disableRowSelectionOnClick />
        </Box>
      </CardContent>
    </Card>
  </Box>
);
