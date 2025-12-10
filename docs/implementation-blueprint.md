# Implementation Blueprint — Plataforma Boletins Frei

## 1. Repository Layout
```
colaboraFREI/
├─ docs/
│  ├─ implementation-blueprint.md   # arquitetura e decisões
│  └─ api-contract.md               # OpenAPI draft (a criar)
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ api/
│  │  │  ├─ __init__.py
│  │  │  ├─ auth.py
│  │  │  ├─ alunos.py
│  │  │  ├─ notas.py
│  │  │  ├─ turmas.py
│  │  │  ├─ relatorios.py
│  │  │  └─ uploads.py
│  │  ├─ core/
│  │  │  ├─ config.py
│  │  │  ├─ database.py
│  │  │  └─ security.py
│  │  ├─ services/
│  │  │  ├─ analytics.py
│  │  │  └─ ingestion.py
│  │  └─ models/
│  │     ├─ __init__.py
│  │     ├─ aluno.py
│  │     ├─ nota.py
│  │     └─ usuario.py
│  ├─ tests/
│  ├─ pyproject.toml
│  ├─ alembic.ini (se migrar p/ Alembic futuramente)
│  └─ README.md
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ routes.tsx
│  │  │  └─ store.ts
│  │  ├─ components/
│  │  ├─ features/
│  │  │  ├─ dashboard/
│  │  │  ├─ alunos/
│  │  │  ├─ turmas/
│  │  │  ├─ notas/
│  │  │  ├─ graficos/
│  │  │  └─ relatorios/
│  │  ├─ layouts/
│  │  ├─ lib/
│  │  ├─ theme/
│  │  └─ types/
│  ├─ public/
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
└─ prompt.md
```

## 2. Backend Decisions
- **Framework**: Flask 3.x com Blueprint modular e `flask-jwt-extended` para JWT.
- **Configuração**: `pydantic-settings` para variáveis (.env). Ambiente dev vs prod.
- **Banco**: SQLite (WAL) via SQLAlchemy 2.0; camadas de modelo e repositório separados.
- **Ingestão**: `services/ingestion.py` agora parseia PDFs com `pdfplumber`, normaliza linhas e faz *upsert* direto em `Aluno/Nota`; mantém ponto de extensão para mover a execução para uma fila (Celery/RQ) futuramente.
- **Validação**: Marshmallow/Pydantic para schemas API.
- **Observabilidade**: logging estruturado (loguru) + middlewares de request timing.
- **Testes**: Pytest + coverage; fixtures para banco em memória.

## 3. Frontend Decisions
- **Stack**: React 18 + Vite + TypeScript.
- **UI Kit**: MUI v6 (Joy + Material mix) com tokens próprios.
- **Estado**: Redux Toolkit + RTK Query p/ chamadas REST.
- **Roteamento**: React Router 6.26+ com rotas protegidas via loader.
- **Charts**: Recharts (principais) + @mui/x-charts para casos simples.
- **Formulários**: React Hook Form + Zod.
- **Temas**: Sistema claro/escuro com CSS variables e persistência em `localStorage`.
- **Internacionalização**: pt-BR inicial, preparado para i18n (react-i18next) se exigido.

## 4. API Surface (Resumo)
| Domínio | Endpoints (prefix `/api/v1`) | Notas |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | JWT + refresh, roles no payload |
| Alunos | `GET /alunos`, `GET /alunos/{id}`, `POST /alunos`, `PUT /alunos/{id}`, `DELETE /alunos/{id}` | Filtros por turno/turma, paginação |
| Notas | `GET /notas`, `PATCH /notas/{id}` | Atualização restrita a admin |
| Turmas | `GET /turmas`, `GET /turmas/{id}` | KPIs agregados |
| Relatórios | `GET /relatorios/{tipo}` | Accept `csv|xlsx|pdf` |
| Gráficos | `GET /graficos/{tipo}` | Dados normalizados p/ charts |
| Uploads | `POST /uploads/pdf` | Chama pipeline ingestão, retorna job id |

## 5. Milestones
1. **Fundação**: configs, lint, containers dev, endpoints stub com testes.
2. **Autenticação + Dashboard API**: fluxos auth, KPIs essenciais.
3. **Módulos CRUD**: alunos, turmas, notas com filtros.
4. **Relatórios e Exportações**: rotas avançadas e serviços.
5. **Ingestão + Admin**: upload, monitoramento, gestão de usuários.
6. **Polimento**: testes e documentação final.

## 6. Próximas Tarefas
- Criar scaffolds em `backend/` (Flask app básico) e `frontend/` (Vite React).
- Esboçar contrato API em `docs/api-contract.md` (OpenAPI 3.1) após scaffold.
- Configurar automações (pre-commit, lint, CI) na próxima etapa.

## 7. Fluxo de Upload Atualizado
- `POST /api/v1/uploads/pdf` exige `turno` e `turma`, armazena o PDF em `UPLOAD_FOLDER/<turno>/<turma>` e dispara `enqueue_pdf` imediatamente.
- `enqueue_pdf` gera um `job_id`, processa o arquivo com `parse_pdf` e aplica as notas: matrículas existentes são atualizadas; novas são criadas automaticamente.
- Frontend ganhou a página `/uploads` com formulário (turno + turma + arquivo) e *feedback* de sucesso/erro usando `useUploadBoletimMutation` (RTK Query).
- Alertas rápidos instruem o usuário sobre como o processamento organiza as pastas e como os dados serão refletidos no dashboard após a ingestão.
