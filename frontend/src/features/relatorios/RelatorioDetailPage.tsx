import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
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

import { useGetRelatorioQuery } from "../../lib/api";
import { RELATORIOS_BY_SLUG, type RelatorioSlug } from "./config";

export const RelatorioDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: RelatorioSlug }>();
  const definition = slug ? RELATORIOS_BY_SLUG[slug] : undefined;
  const { data, isLoading, isError } = useGetRelatorioQuery(slug ?? "", {
    skip: !slug || !definition
  });

  if (!definition) {
    return <Alert severity="warning">Relatório não encontrado.</Alert>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Não foi possível carregar os dados deste relatório.</Alert>;
  }

  const rows = Array.isArray(data.dados) ? data.dados : [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Breadcrumbs>
          <Link component={RouterLink} to="/relatorios" underline="hover">
            Relatórios
          </Link>
          <Typography color="text.primary">{definition.title}</Typography>
        </Breadcrumbs>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={600}>
            {definition.title}
          </Typography>
          <Typography color="text.secondary">{definition.description}</Typography>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              {definition.columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={definition.columns.length} align="center">
                  <Typography color="text.secondary">Nenhum dado disponível.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${definition.slug}-${index}`} hover>
                  {definition.columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};
