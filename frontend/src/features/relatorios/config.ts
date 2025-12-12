import type { ReactNode } from "react";

export type RelatorioSlug =
  | "turmas-mais-faltas"
  | "melhores-medias"
  | "alunos-em-risco"
  | "disciplinas-notas-baixas"
  | "melhores-alunos";

export type RelatorioColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render: (row: Record<string, unknown>) => ReactNode;
};

export type RelatorioDefinition = {
  slug: RelatorioSlug;
  title: string;
  description: string;
  columns: RelatorioColumn[];
};

const asNumber = (value: unknown, digits = 1) => {
  if (typeof value === "number") return value.toFixed(digits);
  if (typeof value === "string" && value) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed.toFixed(digits);
  }
  return "-";
};

export const RELATORIOS: RelatorioDefinition[] = [
  {
    slug: "turmas-mais-faltas",
    title: "Turmas com mais faltas",
    description: "Top 10 turmas com índice crítico",
    columns: [
      { key: "turma", label: "Turma", render: (row) => row.turma as ReactNode },
      {
        key: "faltas",
        label: "Total de faltas",
        align: "right",
        render: (row) => Number(row.faltas ?? 0).toLocaleString(),
      },
    ],
  },
  {
    slug: "melhores-medias",
    title: "Melhores médias",
    description: "Ranking geral por turma",
    columns: [
      { key: "turma", label: "Turma", render: (row) => row.turma as ReactNode },
      { key: "turno", label: "Turno", render: (row) => row.turno as ReactNode },
      {
        key: "media",
        label: "Média",
        align: "right",
        render: (row) => asNumber(row.media, 1),
      },
    ],
  },
  {
    slug: "alunos-em-risco",
    title: "Alunos em risco",
    description: "Alunos com média inferior a 15",
    columns: [
      { key: "nome", label: "Aluno", render: (row) => row.nome as ReactNode },
      { key: "turma", label: "Turma", render: (row) => row.turma as ReactNode },
      {
        key: "media",
        label: "Média",
        align: "right",
        render: (row) => asNumber(row.media, 1),
      },
    ],
  },
  {
    slug: "disciplinas-notas-baixas",
    title: "Disciplinas desafiadoras",
    description: "Mapeamento das menores notas",
    columns: [
      { key: "disciplina", label: "Disciplina", render: (row) => row.disciplina as ReactNode },
      {
        key: "media",
        label: "Média",
        align: "right",
        render: (row) => asNumber(row.media, 1),
      },
    ],
  },
  {
    slug: "melhores-alunos",
    title: "Melhores alunos",
    description: "Top 10 alunos com as maiores médias",
    columns: [
      { key: "nome", label: "Aluno", render: (row) => row.nome as ReactNode },
      { key: "turma", label: "Turma", render: (row) => row.turma as ReactNode },
      { key: "turno", label: "Turno", render: (row) => row.turno as ReactNode },
      {
        key: "media",
        label: "Média",
        align: "right",
        render: (row) => asNumber(row.media, 2),
      },
    ],
  },
];

export const RELATORIOS_BY_SLUG = Object.fromEntries(
  RELATORIOS.map((relatorio) => [relatorio.slug, relatorio])
) as Record<RelatorioSlug, RelatorioDefinition>;
