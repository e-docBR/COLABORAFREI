
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Chip
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useListAuditLogsQuery } from "../../lib/api";

dayjs.locale("pt-br");

export const AuditLogsPage = () => {
    const { data: logs, isLoading, error } = useListAuditLogsQuery();

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">Erro ao carregar logs de auditoria.</Alert>;
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Logs de Auditoria
            </Typography>
            <Typography color="text.secondary" mb={4}>
                Registro de ações críticas no sistema (últimos 100 eventos).
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Data/Hora</TableCell>
                            <TableCell>Usuário (ID)</TableCell>
                            <TableCell>Ação</TableCell>
                            <TableCell>Alvo</TableCell>
                            <TableCell>Detalhes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs?.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    {dayjs(log.timestamp).format("DD/MM/YYYY HH:mm:ss")}
                                </TableCell>
                                <TableCell>{log.user_id ? `User #${log.user_id}` : "Sistema"}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.action}
                                        size="small"
                                        color={log.action.includes("DELETE") ? "error" : log.action.includes("UPDATE") ? "warning" : "default"}
                                    />
                                </TableCell>
                                <TableCell>{log.target_type}</TableCell>
                                <TableCell>
                                    <Typography variant="caption" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                                        {JSON.stringify(log.details, null, 2)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!logs?.length && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">Nenhum registro encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
