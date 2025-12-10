import { Alert, Box, Card, CardContent, Grid2 as Grid, Skeleton, Typography } from "@mui/material";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

import { useGetDashboardKpisQuery } from "../../lib/api";

const lineData = [
  { trimestre: "1º", media: 14.8 },
  { trimestre: "2º", media: 15.1 },
  { trimestre: "3º", media: 15.4 }
];

const pieData = [
  { name: "Aprovados", value: 78 },
  { name: "Recuperação", value: 15 },
  { name: "Reprovados", value: 7 }
];

const pieColors = ["#18b26b", "#f5a524", "#ff5c5c"];

const formatNumber = new Intl.NumberFormat("pt-BR");

type KpiCard = {
  label: string;
  value: number;
  helper: string;
  formatter?: (value: number) => string;
};

export const DashboardPage = () => {
  const { data, isLoading, isError } = useGetDashboardKpisQuery();

  const kpiCards: KpiCard[] = [
    {
      label: "Total de Alunos",
      value: data?.total_alunos ?? 0,
      helper: "Estudantes ativos"
    },
    {
      label: "Turmas Ativas",
      value: data?.total_turmas ?? 0,
      helper: "Séries monitoradas"
    },
    {
      label: "Alunos em Risco",
      value: data?.alunos_em_risco ?? 0,
      helper: "Notas abaixo de 15"
    },
    {
      label: "Média Geral",
      value: data?.media_geral ?? 0,
      helper: "Último trimestre",
      formatter: (value: number) => value.toFixed(1)
    }
  ];

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {isError && <Alert severity="error">Não foi possível carregar os KPIs em tempo real.</Alert>}

      <Grid container spacing={2}>
        {kpiCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ background: "linear-gradient(135deg, #0b1f3a 0%, #112a54 100%)", color: "white" }}>
              <CardContent>
                <Typography variant="overline" color="rgba(255,255,255,0.7)" fontWeight={600}>
                  {card.label}
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" height={42} sx={{ bgcolor: "rgba(255,255,255,0.16)" }} />
                ) : (
                  <Typography variant="h4" fontWeight={600} mt={1}>
                    {card.formatter ? card.formatter(card.value) : formatNumber.format(card.value)}
                  </Typography>
                )}
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  {card.helper}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Evolução das médias trimestrais
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="trimestre" />
                    <YAxis domain={[12, 18]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="media" stroke="#0066ff" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Situação geral
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
