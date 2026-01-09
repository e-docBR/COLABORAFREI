# Plataforma Boletins Frei

Monorepo com backend Flask e frontend React/Vite para gestão de boletins escolares.

## Como rodar localmente (Recomendado: Docker)
A forma mais fácil de rodar todo o sistema (Backend, Frontend, Banco e Redis) é usando Docker.

### 1) Com Docker Compose
- **Requisitos**: Docker Engine 24+ e Docker Compose Plugin.
- **Comando**:
  ```bash
  docker-compose up -d --build
  ```
- **Acessar**:
  - Frontend: http://localhost:5173
  - Backend API: http://localhost:5000
- **Inicializar Banco**:
  ```bash
  docker-compose exec backend flask --app app init-db
  ```

## Como rodar localmente (Manual / Legado)

### 1) Backend (Flask)
- Requisitos: Python 3.12+, SQLite 3.45+.
- Comandos:
  ```bash
  cd backend
  python -m venv .venv
  source .venv/bin/activate
  pip install -e .[dev]
  cp .env.example .env  # ajuste variaveis se necessario
  flask --app app run --debug --host 0.0.0.0 --port 5000
  ```
- Endpoints basicos: `/` e `/health`.
- CLI util: `flask init-db` (cria schema) e `flask seed-demo` (dados demo com admin/admin).

### 2) Frontend (Vite/React)
- Requisitos: Node 18+ e npm/pnpm.
- Comandos (npm):
  ```bash
  cd frontend
  npm install
  npm run dev -- --host --port 5173
  ```
- Opcional: crie `.env` em `frontend/` com `VITE_API_BASE_URL=http://localhost:5000/api/v1` para builds sem proxy do Vite.

### 3) Acessar
- Backend: http://localhost:5000
- Frontend: http://localhost:5173 (usa o backend em 5000)

## Estrutura
- `backend/`: API Flask (ver [backend/README.md](backend/README.md)).
- `frontend/`: SPA React (ver [frontend/README.md](frontend/README.md)).
- `docs/`: materiais de planejamento.
- `data/`: uploads e banco local.

## Checklist para subir no GitHub
1. Conferir status: `git status`.
2. Adicionar mudancas: `git add .` (ou arquivos especificos).
3. Commitar: `git commit -m "mensagem descritiva"`.
4. Enviar: `git push origin main` (ou o branch em uso).

## Observacoes
- O aviso 404 para `/sw.js` ao acessar o backend e esperado; nao ha service worker estatico no projeto.
- Para producao, use um servidor WSGI (ex.: gunicorn) em vez do `flask run`.
