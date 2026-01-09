import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useState } from "react";
import { useCreateComunicadoMutation, useListComunicadosQuery } from "../../lib/api";
import { useAppSelector } from "../../app/hooks";

export const ComunicadosPage = () => {
    const { data: comunicados, isLoading } = useListComunicadosQuery();
    const [createComunicado, { isLoading: isCreating }] = useCreateComunicadoMutation();
    const user = useAppSelector((state) => state.auth.user);
    const isAdmin = user?.role === "admin" || user?.role === "professor";

    const [open, setOpen] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [targetType, setTargetType] = useState("TODOS");
    const [targetValue, setTargetValue] = useState("");

    const handleCreate = async () => {
        try {
            await createComunicado({ titulo, conteudo, target_type: targetType, target_value: targetValue }).unwrap();
            setOpen(false);
            setTitulo("");
            setConteudo("");
        } catch {
            alert("Erro ao enviar comunicado");
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700}>
                    Mural de Avisos
                </Typography>
                {isAdmin && (
                    <Button variant="contained" onClick={() => setOpen(true)}>
                        Novo Comunicado
                    </Button>
                )}
            </Stack>

            {isLoading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={2}>
                    {comunicados?.map((comm) => (
                        <Grid item xs={12} key={comm.id}>
                            <Card>
                                <CardHeader
                                    title={comm.titulo}
                                    subheader={`${new Date(comm.data_envio).toLocaleString()} • Por: ${comm.autor}`}
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>
                                        {comm.conteudo}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {comunicados?.length === 0 && (
                        <Grid item xs={12}>
                            <Typography color="text.secondary">Nenhum comunicado encontrado.</Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Novo Comunicado</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Título" fullWidth value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                        <TextField
                            label="Mensagem"
                            fullWidth
                            multiline
                            rows={4}
                            value={conteudo}
                            onChange={(e) => setConteudo(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Destinatário</InputLabel>
                            <Select value={targetType} label="Destinatário" onChange={(e) => setTargetType(e.target.value)}>
                                <MenuItem value="TODOS">Todos (Escola Inteira)</MenuItem>
                                <MenuItem value="TURMA">Turma Específica</MenuItem>
                            </Select>
                        </FormControl>
                        {targetType === "TURMA" && (
                            <TextField
                                label="Nome da Turma (Ex: 9º ANO A)"
                                fullWidth
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                helperText="Digite o nome exato da turma"
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} variant="contained" disabled={isCreating}>
                        Enviar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
