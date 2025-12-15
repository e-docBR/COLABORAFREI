export type ChartSlug =
  | "disciplinas-medias"
  | "turmas-trimestre"
  | "situacao-distribuicao"
  | "faltas-por-turma"
  | "heatmap-disciplinas"
  | "medias-por-trimestre";

export type ChartDefinition = {
  slug: ChartSlug;
  title: string;
  description: string;
  type: "bar" | "line" | "pie" | "heatmap";
  xKey?: string;
  yKey?: string;
  valueKey?: string;
  supportsTurno?: boolean;
  supportsSerie?: boolean;
  supportsTurma?: boolean;
  supportsTrimestre?: boolean;
  supportsDisciplina?: boolean;
  maxItems?: number;
};

export const CHARTS: ChartDefinition[] = [
  {
    slug: "disciplinas-medias",
    title: "Comparativo de médias por disciplina",
    description: "Médias filtradas por turno, turma e trimestre",
    type: "bar",
    xKey: "disciplina",
    yKey: "media",
    supportsTurno: true,
    supportsTurma: true,
    supportsTrimestre: true
  },
  {
    slug: "medias-por-trimestre",
    title: "Gráficos Comparativos - Médias por Trimestre",
    description: "Médias por trimestre com filtros por turno, série, turma e disciplina",
    type: "bar",
    xKey: "trimestre",
    yKey: "media",
    supportsTurno: true,
    supportsSerie: true,
    supportsTurma: true,
    supportsDisciplina: true
  },
  {
    slug: "turmas-trimestre",
    title: "Evolução das turmas por trimestre",
    description: "Acompanhamento das médias trimestrais",
    type: "line",
    yKey: "media",
    supportsTurno: true,
    supportsTurma: true
  },
  {
    slug: "situacao-distribuicao",
    title: "Distribuição de situações",
    description: "Soma de alunos aprovados x recuperação",
    type: "pie",
    valueKey: "total",
    supportsTurno: true,
    supportsTurma: true
  },
  {
    slug: "faltas-por-turma",
    title: "Ranking de faltas por turma",
    description: "Turmas com maiores índices de faltas",
    type: "bar",
    xKey: "turma",
    yKey: "faltas",
    supportsTurno: true
  },
  {
    slug: "heatmap-disciplinas",
    title: "Heatmap de disciplinas",
    description: "Matriz de médias por disciplina x turma",
    type: "heatmap",
    supportsTurno: true,
    supportsTurma: true,
    supportsTrimestre: true,
    maxItems: 50
  }
];

export const CHARTS_BY_SLUG = Object.fromEntries(CHARTS.map((chart) => [chart.slug, chart])) as Record<
  ChartSlug,
  ChartDefinition
>;

export const TRIMESTRES = [
  { value: "1", label: "1º Trimestre" },
  { value: "2", label: "2º Trimestre" },
  { value: "3", label: "3º Trimestre" }
];

export const TURNOS = [
  { value: "Matutino", label: "Matutino" },
  { value: "Vespertino", label: "Vespertino" },
  { value: "Noturno", label: "Noturno" }
];
