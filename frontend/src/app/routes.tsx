import { createBrowserRouter, redirect } from "react-router-dom";

import { DashboardLayout } from "../layouts/DashboardLayout";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AlunosPage } from "../features/alunos/AlunosPage";
import { AlunoDetailPage } from "../features/alunos/AlunoDetailPage";
import { TurmasPage } from "../features/turmas/TurmasPage";
import { TurmaDetailPage } from "../features/turmas/TurmaDetailPage";
import { NotasPage } from "../features/notas/NotasPage";
import { GraficosPage } from "../features/graficos/GraficosPage";
import { RelatoriosPage } from "../features/relatorios/RelatoriosPage";
import { RelatorioDetailPage } from "../features/relatorios/RelatorioDetailPage";
import { UploadsPage } from "../features/uploads/UploadsPage";
import { UsuariosPage } from "../features/usuarios/UsuariosPage";
import { LoginPage } from "../features/auth/LoginPage";
import { ChangePasswordPage } from "../features/auth/ChangePasswordPage";
import { store } from "./store";
import { MeuBoletimPage } from "../features/alunos/MeuBoletimPage";

const requireAuth = async () => {
  const state = store.getState();
  const isAuthenticated = Boolean(state.auth.accessToken);
  if (!isAuthenticated) {
    throw redirect("/login");
  }
  return null;
};

export const appRouter = createBrowserRouter([
  {
    path: "/",
    loader: requireAuth,
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "alunos", element: <AlunosPage /> },
      { path: "alunos/:alunoId", element: <AlunoDetailPage /> },
      { path: "turmas", element: <TurmasPage /> },
      { path: "turmas/:turmaId", element: <TurmaDetailPage /> },
      { path: "notas", element: <NotasPage /> },
      { path: "graficos", element: <GraficosPage /> },
      { path: "relatorios", element: <RelatoriosPage /> },
      { path: "relatorios/:slug", element: <RelatorioDetailPage /> },
      { path: "uploads", element: <UploadsPage /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "meu-boletim", element: <MeuBoletimPage /> }
    ]
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/alterar-senha",
    element: <ChangePasswordPage />
  }
]);
