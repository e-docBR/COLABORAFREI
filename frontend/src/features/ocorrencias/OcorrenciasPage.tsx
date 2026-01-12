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
    Autocomplete,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem as MuiMenuItem,
    ListItemIcon,
    Tooltip
} from "@mui/material";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import {
    useCreateOcorrenciaMutation,
    useListOcorrenciasQuery,
    useListAlunosQuery,
    useUpdateOcorrenciaMutation,
    useDeleteOcorrenciaMutation
} from "../../lib/api";
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
    const [updateOcorrencia] = useUpdateOcorrenciaMutation();
    const [deleteOcorrencia] = useDeleteOcorrenciaMutation();

    const user = useAppSelector((state) => state.auth.user);
    const isStaff = user?.role !== "aluno";

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [alunoId, setAlunoId] = useState<number | null>(null);
    const [tipo, setTipo] = useState("ADVERTENCIA");
    const [descricao, setDescricao] = useState("");

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuOcorrencia, setMenuOcorrencia] = useState<any | null>(null);

    const [searchTerm, setSearchTerm] = useState("");

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, ocorrencia: any) => {
        setAnchorEl(event.currentTarget);
        setMenuOcorrencia(ocorrencia);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuOcorrencia(null);
    };

    const filteredOcorrencias = ocorrencias?.filter((oc) => {
        if (!searchTerm) return true;
        const lowTerm = searchTerm.toLowerCase();
        return (
            oc.aluno_nome?.toLowerCase().includes(lowTerm) ||
            oc.descricao?.toLowerCase().includes(lowTerm) ||
            oc.tipo?.toLowerCase().includes(lowTerm)
        );
    }) || [];

    const handleSave = async () => {
        if (!alunoId) return;
        try {
            if (editingId) {
                await updateOcorrencia({
                    id: editingId,
                    tipo,
                    descricao
                }).unwrap();
            } else {
                await createOcorrencia({
                    aluno_id: alunoId,
                    tipo,
                    descricao,
                    data_ocorrencia: new Date().toISOString()
                }).unwrap();
            }
            setOpen(false);
            resetForm();
        } catch {
            alert("Erro ao salvar ocorrência");
        }
    };

    const resetForm = () => {
        setDescricao("");
        setAlunoId(null);
        setEditingId(null);
        setTipo("ADVERTENCIA");
    };

    const handleEdit = () => {
        if (!menuOcorrencia) return;
        setEditingId(menuOcorrencia.id);
        setAlunoId(menuOcorrencia.aluno_id);
        setTipo(menuOcorrencia.tipo);
        setDescricao(menuOcorrencia.descricao);
        setOpen(true);
        handleCloseMenu();
    };

    const handleDelete = async () => {
        if (!menuOcorrencia) return;
        if (confirm("Tem certeza que deseja excluir esta ocorrência?")) {
            await deleteOcorrencia(menuOcorrencia.id);
        }
        handleCloseMenu();
    };

    const handleToggleResolve = async () => {
        if (!menuOcorrencia) return;
        await updateOcorrencia({
            id: menuOcorrencia.id,
            resolvida: !menuOcorrencia.resolvida
        });
        handleCloseMenu();
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

            <Box mb={3}>
                <TextField
                    placeholder="Buscar por aluno, tipo ou descrição..."
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { backgroundColor: "background.paper", borderRadius: 2 }
                    }}
                />
            </Box>

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
                                {isStaff && <TableCell align="right">Ações</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredOcorrencias.map((oc) => (
                                <TableRow key={oc.id}>
                                    <TableCell>{new Date(oc.data_ocorrencia).toLocaleDateString()}</TableCell>
                                    <TableCell>{oc.aluno_nome}</TableCell>
                                    <TableCell>
                                        <Chip label={oc.tipo} color={TIPO_COLORS[oc.tipo] || "default"} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ textDecoration: oc.resolvida ? "line-through" : "none" }}>
                                            {oc.descricao}
                                        </Typography>
                                        {oc.resolvida && <Chip label="Encerrado" size="small" variant="outlined" color="success" sx={{ mt: 0.5 }} icon={<CheckCircleIcon />} />}
                                    </TableCell>
                                    <TableCell>{oc.autor_nome}</TableCell>
                                    {isStaff && (
                                        <TableCell align="right">
                                            <IconButton onClick={(e) => handleOpenMenu(e, oc)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {filteredOcorrencias.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        Nenhuma ocorrência encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
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
                <MuiMenuItem onClick={handleToggleResolve}>
                    <ListItemIcon><CheckCircleIcon fontSize="small" color={menuOcorrencia?.resolvida ? "disabled" : "success"} /></ListItemIcon>
                    {menuOcorrencia?.resolvida ? "Reabrir" : "Encerrar"}
                </MuiMenuItem>
                <MuiMenuItem onClick={handleDelete}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <Typography color="error">Excluir</Typography>
                </MuiMenuItem>
            </Menu>

            <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} fullWidth maxWidth="sm">
                <DialogTitle>{editingId ? "Editar Ocorrência" : "Nova Ocorrência"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Autocomplete
                            options={alunosData?.items || []}
                            getOptionLabel={(option) => `${option.nome} (${option.turma})`}
                            onChange={(_, value) => setAlunoId(value?.id || null)}
                            value={alunosData?.items?.find((a) => a.id === alunoId) || null}
                            renderInput={(params) => <TextField {...params} label="Aluno" />}
                            disabled={!!editingId} // Disable student change on edit to simplify
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
                    <Button onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" color="error" disabled={isCreating || !alunoId}>
                        {editingId ? "Salvar Alterações" : "Registrar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
