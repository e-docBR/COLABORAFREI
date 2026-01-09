import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Autocomplete
} from "@mui/material";
import { useState } from "react";
import { useCreateOcorrenciaMutation, useListOcorrenciasQuery, useListAlunosQuery } from "../../lib/api";
import { useAppSelector } from "../../app/hooks";

const TIPO_COLORS: Record<string, any> = {
    ADVERTENCIA: "warning",
    ELOGIO: "success",
    ATRASO: "info",
    SUSPENSAO: "error",
    OUTRO: "default"
};

export const OcorrenciasPage = () => {
    const { data: ocorrencias, isLoading } = useListOcorrenciasQuery();
    const { data: alunosData } = useListAlunosQuery({ per_page: 1000 }); // Fetch many for autocomplete
    const [createOcorrencia, { isLoading: isCreating }] = useCreateOcorrenciaMutation();
    const user = useAppSelector((state) => state.auth.user);
    const isStaff = user?.role !== "aluno";

    const [open, setOpen] = useState(false);
    const [alunoId, setAlunoId] = useState<number | null>(null);
    const [tipo, setTipo] = useState("ADVERTENCIA");
    const [descricao, setDescricao] = useState("");

    const handleCreate = async () => {
        if (!alunoId) return;
        try {
            await createOcorrencia({
                aluno_id: alunoId,
                tipo,
                descricao,
                data_ocorrencia: new Date().toISOString()
            }).unwrap();
            setOpen(false);
            setDescricao("");
            setAlunoId(null);
        } catch {
            alert("Erro ao registrar ocorrência");
        }
    };

    if (!isStaff && !isLoading && (!ocorrencias || ocorrencias.length === 0)) {
        return <Typography>Você não tem ocorrências registradas.</Typography>;
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700}>
                    Ocorrências Disciplinares
                </Typography>
                {isStaff && (
                    <Button variant="contained" onClick={() => setOpen(true)} color="error">
                        Registrar Ocorrência
                    </Button>
                )}
            </Stack>

            {isLoading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Card}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Aluno</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Autor</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ocorrencias?.map((oc) => (
                                <TableRow key={oc.id}>
                                    <TableCell>{new Date(oc.data_ocorrencia).toLocaleDateString()}</TableCell>
                                    <TableCell>{oc.aluno_nome}</TableCell>
                                    <TableCell>
                                        <Chip label={oc.tipo} color={TIPO_COLORS[oc.tipo] || "default"} size="small" />
                                    </TableCell>
                                    <TableCell>{oc.descricao}</TableCell>
                                    <TableCell>{oc.autor_nome}</TableCell>
                                </TableRow>
                            ))}
                            {ocorrencias?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Nenhuma ocorrência registrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Nova Ocorrência</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Autocomplete
                            options={alunosData?.items || []}
                            getOptionLabel={(option) => `${option.nome} (${option.turma})`}
                            onChange={(_, value) => setAlunoId(value?.id || null)}
                            renderInput={(params) => <TextField {...params} label="Aluno" />}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
                                <MenuItem value="ADVERTENCIA">Advertência</MenuItem>
                                <MenuItem value="ELOGIO">Elogio</MenuItem>
                                <MenuItem value="ATRASO">Atraso</MenuItem>
                                <MenuItem value="SUSPENSAO">Suspensão</MenuItem>
                                <MenuItem value="OUTRO">Outro</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Descrição do Fato"
                            fullWidth
                            multiline
                            rows={3}
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} variant="contained" color="error" disabled={isCreating || !alunoId}>
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
