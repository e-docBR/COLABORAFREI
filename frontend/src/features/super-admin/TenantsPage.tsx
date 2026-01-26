import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SchoolIcon from "@mui/icons-material/School";
import { useState } from "react";
import { useListTenantsQuery, useCreateTenantMutation, useAddAcademicYearToTenantMutation } from "../../lib/api";
import { useAppSelector } from "../../app/hooks";
import { Navigate } from "react-router-dom";

export const TenantsPage = () => {
    const user = useAppSelector((state) => state.auth.user);
    const { data: tenants, isLoading } = useListTenantsQuery();

    if (user?.role !== "super_admin") {
        return <Navigate to="/app" replace />;
    }

    const [createTenant] = useCreateTenantMutation();
    const [addYear] = useAddAcademicYearToTenantMutation();

    const [openTenantDialog, setOpenTenantDialog] = useState(false);
    const [openYearDialog, setOpenYearDialog] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

    const [newTenant, setNewTenant] = useState({ name: "", slug: "", initial_year: "2024" });
    const [newYearLabel, setNewYearLabel] = useState("");

    const handleCreateTenant = async () => {
        try {
            await createTenant(newTenant).unwrap();
            setOpenTenantDialog(false);
            setNewTenant({ name: "", slug: "", initial_year: "2024" });
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddYear = async () => {
        if (selectedTenantId) {
            try {
                await addYear({ tenantId: selectedTenantId, label: newYearLabel, set_current: true }).unwrap();
                setOpenYearDialog(false);
                setNewYearLabel("");
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (isLoading) return <Typography>Carregando...</Typography>;

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight={700}>
                    Gestão de Escolas (SaaS)
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenTenantDialog(true)}>
                    Nova Escola
                </Button>
            </Box>

            <Grid container spacing={3}>
                {tenants?.map((tenant) => (
                    <Grid item xs={12} key={tenant.id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <SchoolIcon color="primary" />
                                            <Typography variant="h6" fontWeight={600}>
                                                {tenant.name}
                                            </Typography>
                                            <Chip label={tenant.slug} size="small" variant="outlined" />
                                        </Box>
                                        <Typography color="text.secondary" variant="body2">
                                            Anos Acadêmicos:
                                        </Typography>
                                        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                            {tenant.years.map((year: any) => (
                                                <Chip
                                                    key={year.id}
                                                    label={year.label}
                                                    color={year.is_current ? "primary" : "default"}
                                                    variant={year.is_current ? "filled" : "outlined"}
                                                />
                                            ))}
                                            <IconButton size="small" onClick={() => {
                                                setSelectedTenantId(tenant.id);
                                                setOpenYearDialog(true);
                                            }}>
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Button variant="outlined" size="small">
                                        Configurações
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Dialog for New Tenant */}
            <Dialog open={openTenantDialog} onClose={() => setOpenTenantDialog(false)}>
                <DialogTitle>Cadastrar Nova Escola</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1} sx={{ minWidth: 300 }}>
                        <TextField
                            label="Nome da Escola"
                            fullWidth
                            value={newTenant.name}
                            onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                        />
                        <TextField
                            label="Slug (URL prefix)"
                            fullWidth
                            value={newTenant.slug}
                            onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                        />
                        <TextField
                            label="Ano Inicial"
                            fullWidth
                            value={newTenant.initial_year}
                            onChange={(e) => setNewTenant({ ...newTenant, initial_year: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTenantDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreateTenant}>Criar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for New Academic Year */}
            <Dialog open={openYearDialog} onClose={() => setOpenYearDialog(false)}>
                <DialogTitle>Adicionar Novo Ano Acadêmico</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1} sx={{ minWidth: 300 }}>
                        <Typography variant="caption" color="warning.main">
                            Isso criará um novo ciclo para esta escola.
                        </Typography>
                        <TextField
                            label="Rótulo (ex: 2025)"
                            fullWidth
                            value={newYearLabel}
                            onChange={(e) => setNewYearLabel(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenYearDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAddYear}>Adicionar e Definir Atual</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
