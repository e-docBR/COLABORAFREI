import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";

import { useGetGraficoQuery, useListTurmasQuery, type GraficoQueryArgs } from "../../lib/api";
import { CHARTS, CHARTS_BY_SLUG, type ChartSlug, TRIMESTRES, TURNOS } from "./config";

const BAR_COLOR = "#6E44FF";
const PIE_COLORS = ["#6E44FF", "#F06EFF", "#4CC9F0", "#FFD166"];

export const GraficosPage = () => {
  const [chartSlug, setChartSlug] = useState<ChartSlug>("disciplinas-medias");
  const [turno, setTurno] = useState("");
  const [turma, setTurma] = useState("");
  const [trimestre, setTrimestre] = useState("3");
  const chart = CHARTS_BY_SLUG[chartSlug];

  const { data: turmasData } = useListTurmasQuery();
  const turmaOptions = useMemo(() => turmasData?.items ?? [], [turmasData]);

  const queryArgs = useMemo<GraficoQueryArgs>(() => {
    const params: GraficoQueryArgs = { slug: chartSlug };
    if (chart.supportsTurno && turno) params.turno = turno;
    if (chart.supportsTurma && turma) params.turma = turma;
    if (chart.supportsTrimestre && trimestre) params.trimestre = trimestre;
    return params;
  }, [chartSlug, chart, turno, turma, trimestre]);

  const { data, isLoading, isFetching, isError } = useGetGraficoQuery(queryArgs);
  const rawData = useMemo(() => {
    const rows = Array.isArray(data?.dados) ? data?.dados : [];
    if (chart.maxItems) {
      return rows.slice(0, chart.maxItems);
    }
    return rows;
  }, [chart, data]);

  const heatmap = useMemo(() => {
    if (chart.type !== "heatmap") return null;
    const turmasSet = new Set<string>();
    const disciplinasSet = new Set<string>();
    const values = new Map<string, number>();
    for (const row of rawData as Array<Record<string, unknown>>) {
      const turmaNome = String(row.turma ?? "-");
      const disciplina = String(row.disciplina ?? "-");
      turmasSet.add(turmaNome);
      disciplinasSet.add(disciplina);
      const media = typeof row.media === "number" ? row.media : Number(row.media ?? 0);
      values.set(`${turmaNome}-${disciplina}`, Math.round(media * 10) / 10);
    }
    return {
      turmas: Array.from(turmasSet),
      disciplinas: Array.from(disciplinasSet),
      values
    };
  }, [chart.type, rawData]);

  const handleReset = () => {
    setTurno("");
    setTurma("");
    setTrimestre("3");
  };

  const renderChart = () => {
    if (chart.type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Tooltip formatter={(value) => `${value} alunos`} />
            <Pie data={rawData} dataKey={chart.valueKey ?? "total"} nameKey="situacao" label>
              {rawData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chart.type === "line") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={rawData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="trimestre" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={chart.yKey ?? "media"} stroke={BAR_COLOR} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chart.type === "heatmap" && heatmap) {
      return (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Turma</TableCell>
                {heatmap.disciplinas.map((disciplina) => (
                  <TableCell key={disciplina} align="center">
                    {disciplina}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {heatmap.turmas.map((turmaNome) => (
                <TableRow key={turmaNome} hover>
                  <TableCell>{turmaNome}</TableCell>
                  {heatmap.disciplinas.map((disciplina) => {
                    const value = heatmap.values.get(`${turmaNome}-${disciplina}`) ?? 0;
                    const intensity = Math.min(1, Math.max(0, value / 20));
                    const background = `rgba(110, 68, 255, ${0.1 + 0.5 * intensity})`;
                    return (
                      <TableCell key={`${turmaNome}-${disciplina}`} align="center" sx={{ backgroundColor: background }}>
                        {value.toFixed(1)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rawData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={chart.slug === "faltas-por-turma" ? "turma" : "disciplina"} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={chart.yKey ?? "media"} fill={BAR_COLOR} radius={6} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const hasData = rawData.length > 0 || chart.type === "heatmap";

  return (
    <Stack spacing={3}>
      <Tabs
        value={chartSlug}
        onChange={(_event, value) => setChartSlug(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {CHARTS.map((chartItem) => (
          <Tab key={chartItem.slug} label={chartItem.title} value={chartItem.slug} />
        ))}
      </Tabs>

      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        {chart.supportsTurno && (
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="turno-label">Turno</InputLabel>
            <Select
              labelId="turno-label"
              label="Turno"
              value={turno}
              onChange={(event) => setTurno(event.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {TURNOS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {chart.supportsTurma && (
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="turma-label">Turma</InputLabel>
            <Select
              labelId="turma-label"
              label="Turma"
              value={turma}
              onChange={(event) => setTurma(event.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {turmaOptions.map((option) => (
                <MenuItem key={option.turma} value={option.turma}>
                  {option.turma}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {chart.supportsTrimestre && (
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="trimestre-label">Trimestre</InputLabel>
            <Select
              labelId="trimestre-label"
              label="Trimestre"
              value={trimestre}
              onChange={(event) => setTrimestre(event.target.value)}
            >
              {TRIMESTRES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Button onClick={handleReset} disabled={!turno && !turma && trimestre === "3"}>
          Limpar filtros
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={1}>
            {chart.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {chart.description}
          </Typography>

          {isLoading || isFetching ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={280}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error">Não foi possível carregar o gráfico.</Alert>
          ) : hasData ? (
            renderChart()
          ) : (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary">Sem dados para os filtros selecionados.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};
