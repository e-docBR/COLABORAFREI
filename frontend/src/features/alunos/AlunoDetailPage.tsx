import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useGetAlunoQuery } from "../../lib/api";

const formatSituacao = (value?: string | null) => {
  if (!value) return { label: "-", color: "default" as const };
  const normalized = value.toUpperCase();
  if (normalized.startsWith("APR")) return { label: "Aprovado", color: "success" as const };
  if (normalized.startsWith("REC")) return { label: "Recuperação", color: "warning" as const };
  return { label: value, color: "default" as const };
};

const formatNota = (value?: number | null) => (typeof value === "number" ? value.toFixed(1) : "-");

export const AlunoDetailPage = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetAlunoQuery(alunoId ?? "", {
    skip: !alunoId
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Não foi possível carregar o boletim deste aluno.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Breadcrumbs>
          <Link component={RouterLink} to="/app/alunos" underline="hover">
            Alunos
          </Link>
          <Typography color="text.primary">{data.nome}</Typography>
        </Breadcrumbs>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Stack>

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
              <Typography fontWeight={600} color={data.media && data.media < 12 ? "error.main" : "success.main"}>
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

