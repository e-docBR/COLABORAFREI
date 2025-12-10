import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { RootState } from "../app/store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type DashboardKpis = {
  total_alunos: number;
  total_turmas: number;
  media_geral: number;
  alunos_em_risco: number;
};

type LoginRequest = {
  username: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    role?: string;
    is_admin?: boolean;
  };
};

export type AlunoSummary = {
  id: number;
  nome: string;
  matricula: string;
  turma: string;
  turno: string;
  media?: number | null;
};

export type AlunoNota = {
  id: number;
  disciplina: string;
  trimestre1?: number | null;
  trimestre2?: number | null;
  trimestre3?: number | null;
  total?: number | null;
  faltas?: number | null;
  situacao?: string | null;
};

export type AlunoDetail = AlunoSummary & {
  notas: AlunoNota[];
};

type ListAlunosParams = {
  page?: number;
  q?: string;
  turno?: string;
  turma?: string;
};

type ListAlunosResponse = {
  items: AlunoSummary[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
};

export type TurmaSummary = {
  turma: string;
  turno: string;
  total_alunos: number;
  media?: number | null;
  faltas_medias?: number | null;
  slug?: string;
};

type ListTurmasResponse = {
  items: TurmaSummary[];
  total: number;
};

type TurmaAlunosResponse = {
  turma: string;
  turno: string;
  total: number;
  alunos: Array<
    AlunoSummary & {
      situacao?: string | null;
      notas: Array<{
        disciplina: string;
        trimestre1?: number | null;
        trimestre2?: number | null;
        trimestre3?: number | null;
        total?: number | null;
        faltas?: number | null;
        situacao?: string | null;
      }>;
    }
  >;
};

type UploadBoletimPayload = {
  file: File;
  turno: string;
  turma: string;
};

type UploadBoletimResponse = {
  filename: string;
  status: string;
  job_id: string;
  turno: string;
  turma: string;
};

type RelatorioResponse = {
  relatorio: string;
  dados: Array<Record<string, unknown>>;
};

export type GraficoQueryArgs = {
  slug: string;
  turno?: string;
  turma?: string;
  trimestre?: string;
};

const sanitizeParams = (params?: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== "")
  );

export const api = createApi({
  reducerPath: "boletinsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ["Dashboard", "Alunos", "Notas", "Uploads", "Turmas"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body
      })
    }),
    getDashboardKpis: builder.query<DashboardKpis, void>({
      query: () => "/dashboard/kpis",
      providesTags: ["Dashboard"]
    }),
    getAluno: builder.query<AlunoDetail, number | string>({
      query: (alunoId) => ({
        url: `/alunos/${alunoId}`
      }),
      providesTags: (_result, _error, alunoId) => ["Alunos", { type: "Alunos", id: alunoId }]
    }),
    listAlunos: builder.query<ListAlunosResponse, ListAlunosParams | void>({
      query: (params) => ({
        url: "/alunos",
        params: sanitizeParams(params ?? undefined)
      }),
      providesTags: ["Alunos"]
    }),
    listTurmas: builder.query<ListTurmasResponse, void>({
      query: () => ({
        url: "/turmas"
      }),
      providesTags: ["Turmas"]
    }),
    getTurmaAlunos: builder.query<TurmaAlunosResponse, string>({
      query: (slug) => ({
        url: `/turmas/${slug}/alunos`
      }),
      providesTags: (result, _error, slug) => ["Turmas", { type: "Turmas", id: slug }]
    }),
    uploadBoletim: builder.mutation<UploadBoletimResponse, UploadBoletimPayload>({
      query: ({ file, turno, turma }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("turno", turno);
        formData.append("turma", turma);

        return {
          url: "/uploads/pdf",
          method: "POST",
          body: formData
        };
      },
      invalidatesTags: ["Uploads", "Turmas", "Alunos", "Dashboard", "Notas"]
    }),
    getRelatorio: builder.query<RelatorioResponse, string>({
      query: (slug) => ({
        url: `/relatorios/${slug}`
      })
    }),
    getGrafico: builder.query<RelatorioResponse, GraficoQueryArgs>({
      query: ({ slug, ...params }) => ({
        url: `/graficos/${slug}`,
        params: sanitizeParams(params)
      })
    })
  })
});

export const {
  useLoginMutation,
  useGetDashboardKpisQuery,
  useGetAlunoQuery,
  useListAlunosQuery,
  useListTurmasQuery,
  useGetTurmaAlunosQuery,
  useUploadBoletimMutation,
  useGetRelatorioQuery,
  useGetGraficoQuery
} = api;
