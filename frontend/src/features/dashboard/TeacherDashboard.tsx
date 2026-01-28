import { useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Grid,
    List,
    ListItem,
    ListItemText,
    Typography,
    Chip,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGetTeacherDashboardQuery, useListTurmasQuery } from "../../lib/api";

export const TeacherDashboard = () => {
    const [filters, setFilters] = useState({ q: "", turno: "Todos", turma: "Todas" });

    // Convert "Todos"/"Todas" to empty string for API
    const apiFilters = {
        q: filters.q,
        turno: filters.turno === "Todos" ? undefined : filters.turno,
        turma: filters.turma === "Todas" ? undefined : filters.turma
    };

    const { data, isLoading, error } = useGetTeacherDashboardQuery(apiFilters);
    const { data: turmasData } = useListTurmasQuery();

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">Erro ao carregar dashboard do professor.</Alert>;
    }

    if (!data) return null;

    const chartData = Object.entries(data.distribution || {}).map(([key, value]) => ({
        range: key,
        count: value
    }));

    const uniqueTurmas = turmasData?.items.map(t => t.turma) || [];

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} mb={3}>
                Visão do Professor
            </Typography>

            {/* Filters */}
            <Box mb={4} display="flex" gap={2} flexWrap="wrap" alignItems="center" sx={{ backgroundColor: "#F9FAFB", p: 2, borderRadius: 2 }}>
                <TextField
                    placeholder="Nome ou matrícula"
                    variant="outlined"
                    size="small"
                    value={filters.q}
                    onChange={(e) => handleFilterChange("q", e.target.value)}
                    sx={{
                        flexGrow: 1,
                        minWidth: "200px",
                        backgroundColor: "white",
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '20px',
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                <FormControl size="small" sx={{ minWidth: 150, backgroundColor: "white", borderRadius: '20px', '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}>
                    <InputLabel id="turno-label">Turno</InputLabel>
                    <Select
                        labelId="turno-label"
                        value={filters.turno}
                        label="Turno"
                        onChange={(e) => handleFilterChange("turno", e.target.value)}
                    >
                        <MenuItem value="Todos">Todos</MenuItem>
                        <MenuItem value="Manhã">Manhã</MenuItem>
                        <MenuItem value="Tarde">Tarde</MenuItem>
                        <MenuItem value="Integral">Integral</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150, backgroundColor: "white", borderRadius: '20px', '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}>
                    <InputLabel id="turma-label">Turma</InputLabel>
                    <Select
                        labelId="turma-label"
                        value={filters.turma}
                        label="Turma"
                        onChange={(e) => handleFilterChange("turma", e.target.value)}
                    >
                        <MenuItem value="Todas">Todas</MenuItem>
                        {uniqueTurmas.map((turma) => (
                            <MenuItem key={turma} value={turma}>
                                {turma}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Stats */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%" }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Turmas Ativas
                            </Typography>
                            <Typography variant="h3">{data.classes_count}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Grade Distribution */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: 400 }}>
                        <CardHeader title="Distribuição de Notas" subheader="Visão geral (filtrada)" />
                        <CardContent sx={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Risk Alerts */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            title="Alerta de Risco (IA)"
                            subheader="Alunos com média baixa e alta probabilidade de reprovação"
                            titleTypographyProps={{ color: "error.main", fontWeight: 700 }}
                        />
                        <CardContent>
                            <List>
                                {data.alerts?.map((aluno: any) => (
                                    <ListItem key={aluno.id} divider>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" gap={2} alignItems="center">
                                                    <Link
                                                        to={`/app/alunos/${aluno.id}`}
                                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                                    >
                                                        <Typography fontWeight={600} sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                                            {aluno.nome}
                                                        </Typography>
                                                    </Link>
                                                    <Chip label={aluno.turma} size="small" />
                                                </Box>
                                            }
                                            secondary={`Média Atual: ${aluno.media}`}
                                        />
                                        <Box textAlign="right">
                                            <Chip
                                                label={`${(aluno.risk_score * 100).toFixed(0)}% Risco`}
                                                color="error"
                                                variant="filled"
                                            />
                                        </Box>
                                    </ListItem>
                                ))}
                                {(!data.alerts || data.alerts.length === 0) && (
                                    <Typography color="text.secondary">Nenhum alerta de risco detectado.</Typography>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
