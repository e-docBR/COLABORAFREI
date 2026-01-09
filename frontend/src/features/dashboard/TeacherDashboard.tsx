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
    Chip
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGetTeacherDashboardQuery } from "../../lib/api";

export const TeacherDashboard = () => {
    const { data, isLoading, error } = useGetTeacherDashboardQuery();

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

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} mb={3}>
                Visão do Professor
            </Typography>

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
                        <CardHeader title="Distribuição de Notas" subheader="Visão geral de todas as turmas" />
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
                                                    <Typography fontWeight={600}>{aluno.nome}</Typography>
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
