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

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from "@mui/material";
import { useState } from "react";
import { useGetAlunoQuery, AlunoNota, useUpdateAlunoMutation, useDeleteAlunoMutation } from "../../lib/api";
import { useAppSelector } from "../../app/hooks";
import { EditNotaDialog } from "../notas/EditNotaDialog";
import { AlunoForm } from "./AlunoForm";


const formatSituacao = (value?: string | null) => {
  if (!value) return { label: "-", color: "default" as const };
  const normalized = value.toUpperCase();
  if (normalized.startsWith("APR")) return { label: "Aprovado", color: "success" as const };
  if (normalized === "AR") return { label: "Apr Rec", color: "success" as const };
  if (normalized.startsWith("REP")) return { label: "Reprovado", color: "error" as const };
  if (normalized.startsWith("ACC") || normalized.startsWith("APCC")) return { label: "APCC", color: "info" as const };
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

  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [editingNota, setEditingNota] = useState<AlunoNota | null>(null);
  const [editingAluno, setEditingAluno] = useState(false);
  const [deletingAluno, setDeletingAluno] = useState(false);

  const [updateAluno, { isLoading: isUpdating }] = useUpdateAlunoMutation();
  const [deleteAluno, { isLoading: isDeleting }] = useDeleteAlunoMutation();

  const handleUpdate = async (formData: any) => {
    try {
      await updateAluno({ id: Number(alunoId), ...formData }).unwrap();
      setEditingAluno(false);
    } catch (error) {
      console.error("Failed to update aluno", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAluno(Number(alunoId)).unwrap();
      navigate("/app/alunos");
    } catch (error) {
      console.error("Failed to delete aluno", error);
    }
  };


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
        <Stack direction="row" spacing={1}>
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setEditingAluno(true)}
              >
                Editar Aluno
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeletingAluno(true)}
              >
                Excluir
              </Button>
            </>
          )}
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </Stack>
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
              {isAdmin && <TableCell>Ações</TableCell>}
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
                  {isAdmin && (
                    <TableCell>
                      <IconButton size="small" onClick={() => setEditingNota(nota)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {editingNota && (
        <EditNotaDialog
          open={Boolean(editingNota)}
          nota={editingNota}
          onClose={() => setEditingNota(null)}
        />
      )}

      {/* Aluno Edit Dialog */}
      <Dialog open={editingAluno} onClose={() => setEditingAluno(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar Informações do Aluno</DialogTitle>
        <DialogContent>
          <AlunoForm
            initialData={data}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAluno(false)}
            isLoading={isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Aluno Delete Confirmation Dialog */}
      <Dialog open={deletingAluno} onClose={() => setDeletingAluno(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Excluir Aluno?</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o aluno <strong>{data.nome}</strong>?
            <br />
            Esta ação é irreversível e excluirá todas as notas e vínculos associados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeletingAluno(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            Confirmar Exclusão
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>

  );
};

