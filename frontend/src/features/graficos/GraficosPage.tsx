import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { useMemo, useState } from "react";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import GridOnIcon from "@mui/icons-material/GridOn";
import TimelineIcon from "@mui/icons-material/Timeline";
import EqualizerIcon from "@mui/icons-material/Equalizer";
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

import {
  useGetGraficoQuery,
  useGetNotasFiltrosQuery,
  useListTurmasQuery,
  type GraficoQueryArgs
} from "../../lib/api";
import { CHARTS, CHARTS_BY_SLUG, type ChartSlug, TRIMESTRES, TURNOS } from "./config";

const BAR_COLOR = "#6E44FF";
const PIE_COLORS = ["#6E44FF", "#F06EFF", "#4CC9F0", "#FFD166"];

const STATUS_COLORS: Record<string, string> = {
  "Aprovado": "#6E44FF",
  "Recuperação": "#FFD166",
  "Reprovado": "#FF4444",
  "Outros": "#CCCCCC"
};

const CHART_ICONS: Record<string, React.ElementType> = {
  "disciplinas-medias": BarChartIcon,
  "medias-por-trimestre": EqualizerIcon,
  "turmas-trimestre": TimelineIcon,
  "situacao-distribuicao": PieChartIcon,
  "faltas-por-turma": BarChartIcon,
  "heatmap-disciplinas": GridOnIcon
};

export const GraficosPage = () => {
  const [chartSlug, setChartSlug] = useState<ChartSlug>("disciplinas-medias");
  const [turno, setTurno] = useState("");
  const [serie, setSerie] = useState("");
  const [turma, setTurma] = useState("");
  const [trimestre, setTrimestre] = useState("3");
  const [disciplina, setDisciplina] = useState("");
  const chart = CHARTS_BY_SLUG[chartSlug];

  const { data: turmasData } = useListTurmasQuery();
  const turmaOptions = useMemo(() => turmasData?.items ?? [], [turmasData]);
  const serieOptions = useMemo(() => {
    const items = turmasData?.items ?? [];
    const series = new Set<string>();
    items.forEach((item) => {
      const parts = (item.turma ?? "").split(" ");
      const prefix = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : item.turma;
      if (prefix) {
        series.add(prefix);
      }
    });
    return Array.from(series).sort();
  }, [turmasData]);

  const { data: notasFiltrosData } = useGetNotasFiltrosQuery();
  const disciplinaOptions = useMemo(() => {
    const list = notasFiltrosData?.disciplinas ?? [];
    return [...list].sort();
  }, [notasFiltrosData]);

  const queryArgs = useMemo<GraficoQueryArgs>(() => {
    const params: GraficoQueryArgs = { slug: chartSlug };
    if (chart.supportsTurno && turno) params.turno = turno;
    if (chart.supportsSerie && serie) params.serie = serie;
    if (chart.supportsTurma && turma) params.turma = turma;
    if (chart.supportsTrimestre && trimestre) params.trimestre = trimestre;
    if (chart.supportsDisciplina && disciplina) params.disciplina = disciplina;
    return params;
  }, [chartSlug, chart, turno, serie, turma, trimestre, disciplina]);

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
    setSerie("");
    setTurma("");
    setTrimestre("3");
    setDisciplina("");
  };

  const renderChart = () => {
    if (chart.type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Tooltip formatter={(value) => `${value} alunos`} />
            <Pie data={rawData} dataKey={chart.valueKey ?? "total"} nameKey="situacao" label>
              {rawData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.situacao] || PIE_COLORS[index % PIE_COLORS.length]} 
                />
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
          <XAxis dataKey={chart.xKey ?? "disciplina"} />
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
      <Grid container spacing={2}>
        {CHARTS.map((chartItem) => {
          const isActive = chartItem.slug === chartSlug;
          const Icon = CHART_ICONS[chartItem.slug] ?? BarChartIcon;

          return (
            <Grid key={chartItem.slug} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                variant={isActive ? "elevation" : "outlined"}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  borderColor: isActive ? "primary.main" : "divider",
                  boxShadow: isActive ? "0 4px 12px rgba(110, 68, 255, 0.15)" : "none",
                  background: isActive
                    ? "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)"
                    : "background.paper",
                  position: "relative",
                  overflow: "visible",
                  transition: "all 0.3s ease",
                  borderWidth: isActive ? 2 : 1,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    borderColor: "primary.main"
                  }
                }}
              >
                <CardActionArea
                  sx={{
                    height: "100%",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start"
                  }}
                  onClick={() => setChartSlug(chartItem.slug)}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: isActive ? "primary.main" : "action.hover",
                      color: isActive ? "common.white" : "text.secondary",
                      mb: 1.5,
                      transition: "all 0.3s ease"
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>

                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                    color={isActive ? "text.primary" : "text.primary"}
                    lineHeight={1.2}
                  >
                    {chartItem.title}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, flex: 1, lineHeight: 1.4 }}>
                    {chartItem.description}
                  </Typography>

                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    {chartItem.supportsTurno && (
                      <Chip label="Turno" size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                    )}
                    {chartItem.supportsSerie && (
                      <Chip label="Série" size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                    )}
                    {chartItem.supportsTurma && (
                      <Chip label="Turma" size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                    )}
                    {chartItem.supportsDisciplina && (
                      <Chip
                        label="Disc."
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    )}
                    {chartItem.supportsTrimestre && (
                      <Chip
                        label="Trim."
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    )}
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        {chart.supportsTurno && (
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="turno-label" shrink>
              Turno
            </InputLabel>
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

        {chart.supportsSerie && (
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="serie-label" shrink>
              Série
            </InputLabel>
            <Select
              labelId="serie-label"
              label="Série"
              value={serie}
              onChange={(event) => setSerie(event.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {serieOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {chart.supportsTurma && (
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="turma-label" shrink>
              Turma
            </InputLabel>
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

        {chart.supportsDisciplina && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="disciplina-label" shrink>
              Disciplina
            </InputLabel>
            <Select
              labelId="disciplina-label"
              label="Disciplina"
              value={disciplina}
              onChange={(event) => setDisciplina(event.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {disciplinaOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {chart.supportsTrimestre && (
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="trimestre-label" shrink>
              Trimestre
            </InputLabel>
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

        <Button onClick={handleReset} disabled={!turno && !serie && !turma && !disciplina && trimestre === "3"}>
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
