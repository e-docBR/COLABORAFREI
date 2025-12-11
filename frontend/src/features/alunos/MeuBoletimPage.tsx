import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip
} from "@mui/material";
import { useAppSelector } from "../../app/hooks";
import { useGetAlunoQuery } from "../../lib/api";

const formatNota = (value?: number | null) => (typeof value === "number" ? value.toFixed(1) : "-");

const formatSituacao = (value?: string | null) => {
  if (!value) return { label: "-", color: "default" as const };
  const normalized = value.toUpperCase();
  if (normalized.startsWith("APR")) return { label: "Aprovado", color: "success" as const };
  if (normalized.startsWith("REC")) return { label: "Recuperação", color: "warning" as const };
  return { label: value, color: "default" as const };
};

export const MeuBoletimPage = () => {
  const alunoId = useAppSelector((state) => state.auth.user?.aluno_id);
  const alunoKey = alunoId ? String(alunoId) : "";
  const { data, isLoading, isError } = useGetAlunoQuery(alunoKey, {
    skip: !alunoId
  });

  if (!alunoId) {
    return <Alert severity="warning">Seu perfil não está associado a um aluno.</Alert>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Não foi possível carregar seu boletim.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {data.nome}
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} divider={<Divider flexItem orientation="vertical" />}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Matrícula
              </Typography>
              <Typography fontWeight={600}>{data.matricula}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Turma / Turno
              </Typography>
              <Typography fontWeight={600}>
                {data.turma} • {data.turno}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Média geral
              </Typography>
              <Typography fontWeight={600} color={data.media && data.media < 14 ? "error.main" : "success.main"}>
                {typeof data.media === "number" ? data.media.toFixed(1) : "-"}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>1º Tri</TableCell>
              <TableCell>2º Tri</TableCell>
              <TableCell>3º Tri</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Faltas</TableCell>
              <TableCell>Situação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.notas.map((nota) => {
              const situacao = formatSituacao(nota.situacao);
              return (
                <TableRow key={nota.id} hover>
                  <TableCell>{nota.disciplina}</TableCell>
                  <TableCell>{formatNota(nota.trimestre1)}</TableCell>
                  <TableCell>{formatNota(nota.trimestre2)}</TableCell>
                  <TableCell>{formatNota(nota.trimestre3)}</TableCell>
                  <TableCell>{formatNota(nota.total)}</TableCell>
                  <TableCell>{nota.faltas ?? "-"}</TableCell>
                  <TableCell>
                    <Chip label={situacao.label} color={situacao.color} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};
