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
    Typography,
    IconButton,
    Menu,
    MenuItem as MuiMenuItem,
    ListItemIcon,
    Chip
} from "@mui/material";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import {
    useCreateComunicadoMutation,
    useListComunicadosQuery,
    useUpdateComunicadoMutation,
    useDeleteComunicadoMutation
} from "../../lib/api";
import { useAppSelector } from "../../app/hooks";

export const ComunicadosPage = () => {
    const { data: comunicados, isLoading } = useListComunicadosQuery();
    const [createComunicado, { isLoading: isCreating }] = useCreateComunicadoMutation();
    const [updateComunicado] = useUpdateComunicadoMutation();
    const [deleteComunicado] = useDeleteComunicadoMutation();

    const user = useAppSelector((state) => state.auth.user);
    const isAdmin = user?.role === "admin" || user?.role === "professor";

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [targetType, setTargetType] = useState("TODOS");
    const [targetValue, setTargetValue] = useState("");

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuComunicado, setMenuComunicado] = useState<any | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, comm: any) => {
        setAnchorEl(event.currentTarget);
        setMenuComunicado(comm);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuComunicado(null);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateComunicado({ id: editingId, titulo, conteudo }).unwrap();
            } else {
                await createComunicado({ titulo, conteudo, target_type: targetType, target_value: targetValue }).unwrap();
            }
            setOpen(false);
            resetForm();
        } catch {
            alert("Erro ao salvar comunicado");
        }
    };

    const resetForm = () => {
        setTitulo("");
        setConteudo("");
        setEditingId(null);
        setTargetType("TODOS");
        setTargetValue("");
    };

    const handleEdit = () => {
        if (!menuComunicado) return;
        setEditingId(menuComunicado.id);
        setTitulo(menuComunicado.titulo);
        setConteudo(menuComunicado.conteudo);
        setTargetType("TODOS"); // Simplified as we probably don't edit target often or it's complex
        // Ideally we parse target from string, but for now let's focus on content
        setOpen(true);
        handleCloseMenu();
    };

    const handleDelete = async () => {
        if (!menuComunicado) return;
        if (confirm("Tem certeza que deseja excluir este comunicado?")) {
            await deleteComunicado(menuComunicado.id);
        }
        handleCloseMenu();
    };

    const handleToggleArchive = async () => {
        if (!menuComunicado) return;
        await updateComunicado({
            id: menuComunicado.id,
            arquivado: !menuComunicado.arquivado
        });
        handleCloseMenu();
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700}>
                    Mural de Avisos
                </Typography>
                {isAdmin && (
                    <Button variant="contained" onClick={() => { resetForm(); setOpen(true); }}>
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
                            <Card sx={{ opacity: comm.arquivado ? 0.6 : 1 }}>
                                <CardHeader
                                    action={
                                        isAdmin && (
                                            <IconButton onClick={(e) => handleOpenMenu(e, comm)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        )
                                    }
                                    title={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {comm.titulo}
                                            {comm.arquivado && <Chip label="Arquivado" size="small" />}
                                        </Box>
                                    }
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

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MuiMenuItem onClick={handleEdit}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Editar
                </MuiMenuItem>
                <MuiMenuItem onClick={handleToggleArchive}>
                    <ListItemIcon><ArchiveIcon fontSize="small" color="action" /></ListItemIcon>
                    {menuComunicado?.arquivado ? "Desarquivar" : "Arquivar"}
                </MuiMenuItem>
                <MuiMenuItem onClick={handleDelete}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <Typography color="error">Excluir</Typography>
                </MuiMenuItem>
            </Menu>

            <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} fullWidth maxWidth="sm">
                <DialogTitle>{editingId ? "Editar Comunicado" : "Novo Comunicado"}</DialogTitle>
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

                        {!editingId && (
                            <FormControl fullWidth>
                                <InputLabel>Destinatário</InputLabel>
                                <Select value={targetType} label="Destinatário" onChange={(e) => setTargetType(e.target.value)}>
                                    <MenuItem value="TODOS">Todos (Escola Inteira)</MenuItem>
                                    <MenuItem value="TURMA">Turma Específica</MenuItem>
                                </Select>
                            </FormControl>
                        )}
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
                    <Button onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={isCreating}>
                        {editingId ? "Salvar" : "Enviar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
