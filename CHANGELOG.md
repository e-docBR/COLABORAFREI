# Changelog

All notable changes to this project will be documented in this file.

## [0.9.0] - 2026-01-27

### 🚀 Added
- **🌐 Hetzner Cloud Infrastructure**: 
    - Full deployment plan for Hetzner VPS environment.
    - Automated SSL certificates via **Traefik Proxy** with Let's Encrypt integration.
    - Production-grade `.env.production` template with automated secret generation.
- **🛠️ DevOps & CLI Enancements**:
    - **Docker Compose V2 Support**: Optimized orchestration for modern Docker environments.
    - **Database Management CLI**: 
        - New `drop-db` command for safe environment resets.
        - Enhanced `seed-demo` command now automatically provisions mandatory `Tenant` and `AcademicYear` data.
- **🛡️ Infrastructure Hardening**:
    - Implemented **ProxyFix** middleware in Flask to correctly resolve client IPs and HTTPS protocols behind Traefik.
    - Automated SSH key provisioning for secure server management.

### 🔧 Fixes
- **🎨 Frontend Build Corrections**:
    - Fixed TypeScript errors in `api.ts` related to `Comunicado` target types.
    - Resolved JSX duplicate attribute error in `GraficosPage.tsx` preventing production builds.
    - Synchronized `Chart` types with backend multi-tenant data structures.

## [0.8.0] - 2026-01-26

### 🚀 Added
- **🏫 Multi-Tenancy & School Isolation**: 
    - Full architectural support for multiple schools on a single instance.
    - Automated data isolation via `TenantYearMixin` in the ORM.
    - Staged database migration for safe transition of existing data.
- **📅 Academic Year Management**:
    - New `AcademicYear` module for logical separation of school cycles.
    - **Global Year Selector**: Added to the TopBar for seamless switching between current and historical data.
    - **Year Filtering**: Automated backend filtering for all modules (Alunos, Notas, Comunicados, Ocorrências).
    - **Session Persistence**: Academic year state managed via global Redux `appSlice`.
- **🛠️ Super Admin Module**:
    - Centralized management of schools (tenants) and academic cycles.
    - Security-hardened endpoints for SaaS operations.

### 🔧 Technical
- **🛡️ Secure ORM Filters**: Implemented `do_orm_execute` hooks for mandatory tenant and year scoping with specific bypasses for global admin access.
- **🔗 Profile Synchronization**: New `/usuarios/me` endpoint to dynamically resolve student profiles based on the active year.
- **🐛 Bug Fixes**:
    - Fixed login issues related to password hashing for new superadmin accounts.
    - Resolved profile-loading conflicts for global admins in multi-tenant contexts.
    - Removed legacy default credentials from the login screen for better security.

## [0.7.0] - 2026-01-26

### 🚀 Added
- **📱 Mobile First Overhaul**:
    - Implemented **Responsive Drawer Navigation**: Sidebar now automatically converts to a slide-out drawer on mobile devices.
    - **Hamburger Menu**: Added an interactive toggle in the TopBar for small screens.
    - **Adaptive Dashboards**: KPIs and charts now reflow dynamically, with optimized heights for scrolling on smartphones.
    - **Smart Tables**: Implemented column prioritization in the User Management table to hide non-essential data on mobile, ensuring a clean, legible interface.
    - **UI Optimization**: Streamlined the TopBar by hiding less critical info on small devices to maximize content workspace.

### 🔧 Fixes & Enhancements
- **📐 Layout Consistency**: Standardized spacing and transitions across the dashboard layout to eliminate layout shifts during sidebar toggling.
- **⚡ Performance**: Optimized chart rendering for mobile GPU acceleration.

## [0.6.0] - 2026-01-26


### 🚀 Added
- **🤖 AI FreiRonaldo (Advanced Analytics)**:
    - Rebranded and enhanced the AI Assistant with over 20 analytical intents.
    - Added support for **multimodal responses**: Automated Pie Charts for status and Bar Charts for performance/attendance.
    - New deep-analysis features: **Radar de Abandono** (Dropout Radar) and **Missing Grades** detection.
    - Improved natural language processing for Turma recognition (e.g., "6A", "7º ANO B") and student profile lookups.
    - Integrated support for **Mural (Notices)** and **Occurrences** in chat queries.

### 🔧 Fixes & Enhancements
- **🎨 UI/UX Cleanups**: Removed the redundant global search from the Dashboard TopBar to streamline navigation.
- **🛡️ Robust Regex Matching**: Fixed backend NLP issues with accented characters and specific school academic terms.
- **📊 Real-time Chat Sync**: Updated RTK Query hooks and frontend types to support complex AI-generated datasets.

## [0.5.1] - 2026-01-26


### 🔧 Fixes & Enhancements
- **📊 Business Logic Update**: Adjusted the **"Em Risco" (At Risk)** KPI threshold from 60 to **50**. This aligns the dashboard metrics with conservative academic criteria, reducing false positives in risk reporting.

## [0.5.0] - 2026-01-26


### 🚀 Added
- **Student Management (CRUD)**:
    - Implemented full Creation, Update, and Deletion of students.
    - Added `AlunoForm` component for administrative tasks.
    - Integrated edit and delete actions in `AlunoDetailPage`.
    - Backend support with new schemas, services, and endpoints for student persistence.

### 🔧 Fixes & Enhancements
- **🔍 Global Search**: Migrated student search to server-side, enabling discovery of any student in the database regardless of pagination.
- **🎨 Sidebar Visibility**: Fixed contrast issue in Light Mode where the active menu item label would become invisible.
- **📊 Real-time Dashboard Sync**: Configured RTK Query tag invalidation to ensure student counts and averages are updated instantly after CRUD operations.

## [0.4.1] - 2026-01-26


### 🔧 Technical & Bug Fixes
- **🎨 Shared Theme System**: Implemented `ThemeContext` and global `AppThemeProvider` to ensure dark mode is synchronized across all components.
- **📊 Student Analytics Fix**: 
    - Corrected student cards in "Alunos" page to display the arithmetic average of all disciplines.
    - Updated backend repositories and services to calculate real-time averages and total absences during student listing.
    - Sincronized 100-point scale thresholds (Risk < 60) across dashboard, listing, and color logic.
- **🛠️ Refactoring**:
    - Replaced `id` based routing with `slug` in TurmasPage to resolve TypeScript lint errors.
    - Standardized field names (`media`, `alunos_em_risco`) across API and frontend.

## [0.4.0] - 2026-01-26


### 🚀 Added
- **Intelligent Reporting Engine**:
    - **Radar de Abandono**: Predictive report identifying students at high risk of dropout based on attendance and grade trends.
    - **Top Movers**: Trend analysis identifying students with significant performance shifts (up/down).
    - **Eficiência Docente**: Diagnostic report comparing Class vs School averages per discipline.
- **Client-Side Analytics**:
    - Implemented `selectors.ts` for real-time data derivation (Risk Score, Trend Delta).
- **Enhanced Visualizations**:
    - Added support for `Area`, `Scatter`, and `Bar` charts in the reporting module.
    - Integrated `recharts` for dynamic data visualization.

### 🎨 UI/UX Improvements
- **Mural de Avisos**: Redesigned as a modern, social-media style feed with pinned items and semantic icons.
- **Ocorrências**: Transformed into a card-based interface with visual status indicators (Resolved/Pending).
- **Boletim Escolar**: Modernized DataGrid with conditional grade formatting (Red/Amber/Green).

### 🔧 Technical
- **Codebase Optimization**:
    - Migrated report configurations to `config.tsx` to support JSX rendering.
    - Refactored `GraficosPage` and `RelatorioDetailPage` for better component separation and rendering logic.

## [0.2.0] - 2026-01-13

### 🚀 Added
- **Multi-Tenancy Architecture**:
    - Implementação completa de sistema multi-tenant
    - Modelo `Tenant` para isolamento de dados
    - Middleware de tenant context
    - Migrations para suporte a multi-tenancy

- **Arquitetura em Camadas**:
    - **Service Layer**: Lógica de negócio separada (AlunoService, TurmaService, OcorrenciaService, etc.)
    - **Repository Layer**: Abstração de acesso a dados
    - **Schema Layer**: Validação com Pydantic (AlunoSchema, OcorrenciaSchema, etc.)
    - **Exception Handling**: Sistema centralizado de tratamento de erros
    - **Middleware**: Request logging e tenant context

- **Docker Production Support**:
    - `docker-compose.prod.yml` para deployment em produção
    - `Dockerfile.prod` para frontend com Nginx
    - `nginx.conf` para servir frontend otimizado
    - `entrypoint.sh` para inicialização automática de migrações
    - Health checks em todos os serviços

- **Documentação Completa**:
    - `docs/DEPLOYMENT.md`: Guia completo de deployment
    - `docs/ARCHITECTURE.md`: Documentação da arquitetura do sistema
    - Instruções para Docker e deployment manual
    - Troubleshooting e manutenção

### 🔧 Changed
- **Backend Refactoring**:
    - Migração para arquitetura em camadas
    - Separação de responsabilidades (SRP)
    - Melhoria na organização de código
    - Padronização de respostas de API

- **Database Improvements**:
    - Adição de campo `tenant_id` em todas as tabelas principais
    - Índices otimizados para queries multi-tenant
    - Migrations organizadas e versionadas

- **API Enhancements**:
    - Endpoints mais consistentes
    - Melhor tratamento de erros
    - Validação de dados com Pydantic
    - Paginação otimizada

### 🐛 Fixed
- Correção de erro de migração do Alembic (alembic.ini)
- Inicialização automática do banco de dados via entrypoint
- Problemas de CORS em produção
- Isolamento de dados entre tenants

### 📚 Documentation
- Guia completo de deployment (desenvolvimento e produção)
- Documentação de arquitetura com diagramas
- Troubleshooting guide
- Convenções de código e padrões de design

## [Unreleased]
### Added
- **Dashboard Improvements**:
    - Updated "Média Geral" card label to "Média dos Totais" for clarity.
    - Added "Comparativo de médias por disciplina" (Subject Averages) BarChart to Dashboard.
    - Updated "Situação Geral" PieChart to specific categories: Aprovado, Reprovado, Outros.
    - Removed "Evolução das médias trimestrais" LineChart.

### Added
- **Ocorrências System Improvements**:
    - Fixed pagination issue in `api/v1/alunos` ensuring all students appear in the selection dropdown.
    - Added database migration for `ocorrencias` table.
    - Resolved `redis` dependency missing in backend environment.

### Added
- **Phase 6 (Data Corrections)**:
    - **Grade Editing**: Admins can now manually edit grades, absences, and status via the Student Details page.
    - **Audit Log**: All mutations are logged for security (showing old vs new values).
    - **Auto-Calculation**: Editing trimesters automatically recalculates the total if not manually overridden.
    - **Access Control**: Strict `admin` role requirement for data modification.
    - **Student Portal ('Meu Boletim')**: Added Tabs for specialized views:
        - **Boletim**: Grades and absence view.
        - **Ocorrências**: Personal disciplinary records.
        - **Recados**: Targeted communications (filtered to show only Class or Student specific messages).
- **Phase 5 (Advanced)**:
    - **Ocorrências Disciplinares**: Module to register warnings, compliments, and suspensions.
    - **Audit Logs**: Security tracking for critical actions (create/edit).
    - **Advanced AI Analyst**:
        - **Rich Visual Responses**: Chat now renders **Interactive Charts** (Bar) and **Data Tables** directly in the conversation flow.
        - **New Analytical Intents**:
            - *"Hardest Subjects"*: Identifies disciplines with lowest averages.
            - *"Status Distribution"*: Visual breakdown of APR/REP/REC.
            - *"Best Students"*: Top performing students ranking.
            - *"Performance Analysis"*: Lists students above/below global average.
    - **Teacher Dashboard**: Analytics view for teachers (grade distribution, risk alerts).
    - **Risk Engine**: Machine Learning model (Logistic Regression) to predict student failure risk.
- **Phase 6 (Data Corrections & Admin)**:
    - **Audit Logs UI**: Dedicated page for admins to view system logs.
- **Phase 4 (Communication)**:
    - **Comunicados**: Announcement system targeting School (Todos), Class (Turma), or Individual Students.
    - **Portal**: Notification center for students/guardians.
- **Phase 3 (Intelligence)**:
    - **Teacher Dashboard**: Analytics view for teachers (grade distribution, risk alerts).
    - **Risk Engine**: Machine Learning model (Logistic Regression) to predict student failure risk.
- **Infrastructure**:
    - **Docker Support**: `docker-compose.yml` for full-stack orchestration (Backend, Frontend, Postgres, Redis).
    - **PostgreSQL**: Migrated from SQLite for better performance and concurrency.
    - **Background Jobs**: Redis + RQ for asynchronous PDF processing.

### Changed
- Login profile for "Professor" in the authentication screen.
- New status "APCC" (Aprovado pelo Conselho de Classe) logic in backend and frontend.

### Changed
- Updated status calculation: "REP" (Reprovado) takes precedence over "REC" (Recuperação).
- "AR" status is now displayed as "Apr Rec" (Aprovado com Recuperação) in frontend.
- "APCC" (from ACC) status now takes precedence over "AR" in backend calculation.
- Grades below 50.0 are now highlighted in red in the class details view.
- Improved visual labels for "Reprovado" (Red) and "APCC" (Info Blue) in student details.

## [0.1.0] - initial release
- Initial project setup with Flask backend and React frontend.
