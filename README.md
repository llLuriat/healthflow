# HealthFlow

Gestão de fluxo e comunicação para clínicas de pequeno e médio porte.

> Trabalho de Conclusão de Curso · SENAI Candeias – BA · 2026

---

## Descrição da aplicação

O HealthFlow é um protótipo web que apoia a gestão de filas e consultas em clínicas. A recepção registra o check-in, a equipe atualiza o status do atendimento e o painel reflete o fluxo. A aplicação é composta por um backend Express + TypeScript e um frontend React + Vite, com PostgreSQL como banco de dados e isolamento de dados por clínica (tenant).

O projeto está em desenvolvimento e usa dados de demonstração. A visão do paciente em tempo real ainda está em evolução.

## Objetivo

Reduzir a incerteza do paciente e a sobrecarga da recepção por meio de uma plataforma digital acessível e integrada de gestão de fluxo, apoiando a organização das consultas e dando mais visibilidade ao andamento do atendimento. Os impactos ainda não foram medidos e serão avaliados em um piloto.

## Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Backend | Node.js 20+, Express, TypeScript, JWT |
| Frontend | React, Vite, Tailwind CSS |
| Banco de dados | PostgreSQL 14+ (migrations SQL) |
| Testes | Jest |
| Gerenciadores de pacotes | npm (backend) e pnpm ou npm (frontend) |

---

## Como instalar

### Pré-requisitos

- Node.js 20+ (execução nativa)
- npm ou pnpm (execução nativa)
- PostgreSQL 14+ (execução nativa)
- Docker Desktop com Docker Compose v2 (execução por containers)

### 1. Banco de dados

```powershell
# Crie um banco vazio como superuser.
# As migrations são executadas automaticamente quando o backend inicia.
psql -U postgres -c "CREATE DATABASE healthflow;"
```

### 2. Backend

```powershell
cd backend/
Copy-Item .env.example .env
npm install
```

Edite o arquivo `.env` com seus valores:

```env
PORT=3000
DATABASE_URL=postgres://app_user:yourpassword@localhost:5432/healthflow
JWT_SECRET=use_um_segredo_forte_com_pelo_menos_32_chars
JWT_EXPIRES_IN=1h
CORS_ORIGINS=http://localhost:5173
ENABLE_UNSAFE_TENANT=false
```

### 3. Frontend

```powershell
cd frontend/
Copy-Item .env.example .env
pnpm install   # ou npm install
```

Deixe `VITE_API_URL` em branco para usar o proxy do Vite (recomendado em desenvolvimento).

---

## Como executar

### Backend

```bash
cd backend/
npm run dev
# → http://localhost:3000
# → GET http://localhost:3000/health → {"status":"ok"}
```

### Frontend

```bash
cd frontend/
pnpm dev       # ou npm run dev
# → http://localhost:5173
```

### Testes (backend)

```bash
cd backend/
npm test -- --runInBand
```

### Docker Compose (desenvolvimento)

Instale e inicie o **Docker Desktop**. No terminal integrado do VS Code, estes comandos devem retornar versões em vez de erro:

```powershell
docker --version
docker compose version
```

Na raiz do repositório, suba o banco, backend e frontend:

```powershell
docker compose up --build
```

Serviços expostos: PostgreSQL em `localhost:5432`, backend em `http://localhost:3000` e frontend em `http://localhost:5173`. Para encerrar os containers sem apagar dados locais, execute `docker compose down`.

### Docker Compose (produção)

Antes da primeira subida, defina segredos fortes e crie o volume externo exigido pela configuração de produção:

```powershell
$env:JWT_SECRET = "substitua-por-um-segredo-forte"
$env:POSTGRES_PASSWORD = "substitua-por-uma-senha-forte"
docker volume create healthflow_data
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## Estrutura do projeto

```
healthflow/
├── backend/          ← Express + TypeScript (Node.js)
│   ├── src/
│   │   ├── app.ts                            ← CORS + todas as rotas registradas
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── patients.controller.ts
│   │   │   └── consultas.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── patients.routes.ts
│   │   │   └── consultas.routes.ts
│   │   └── middlewares/
│   │       ├── auth.middleware.ts            ← JWT obrigatório
│   │       └── tenant.middleware.ts          ← transação + contexto de tenant
│   └── migrations/
│       ├── 001–003_*.sql                     ← migrations originais
│       └── 004_create_consultas_fix_rls.sql  ← tabela de consultas + ajuste NULLIF
│
└── frontend/         ← React + Vite + Tailwind
    ├── app/
    │   ├── lib/api.ts                        ← cliente HTTP centralizado
    │   ├── context/AuthContext.tsx           ← estado global de autenticação
    │   ├── components/
    │   │   ├── ProtectedRoute.tsx            ← proteção de rotas
    │   │   └── StatusBadge.tsx               ← badge de status (inclui 'cancelled')
    │   ├── layouts/InstitutionLayout.tsx     ← layout com botão de logout
    │   ├── App.tsx                           ← AuthProvider + ProtectedRoute
    │   └── pages/
    │       ├── LoginPage.tsx                 ← login com tenantId
    │       ├── PrimeiroAcessoPage.tsx        ← cadastro da clínica + exibe tenantId
    │       ├── DashboardPage.tsx             ← dados reais do backend
    │       └── ConsultasPage.tsx             ← CRUD de consultas via /consultas
    ├── index.html
    └── vite.config.ts                        ← proxy para o backend em desenvolvimento
```

---

## Funcionalidades principais

- **Cadastro da clínica (primeiro acesso):** cria o tenant e o usuário e exibe o `tenantId`.
- **Login e controle de acesso:** autenticação por JWT e rotas protegidas no frontend e no backend.
- **Dashboard:** consultas do dia, totais e próximas consultas, com dados reais do backend.
- **Gestão de consultas:** criar, listar, atualizar o status e cancelar (cancelamento lógico).
- **Isolamento por clínica (tenant):** o `tenantId` vem sempre do JWT verificado pelo backend, nunca de um header HTTP.
- **Logout:** botão "Sair" na barra lateral remove o token e redireciona para o login.

### Fluxo de teste

```
1. Acesse http://localhost:5173/primeiro-acesso
   → Preencha nome da clínica + segmento → e-mail + senha
   → O backend cria tenant + usuário e retorna o tenantId
   → A tela exibe o UUID com botão "Copiar" — guarde este ID

2. Acesse http://localhost:5173/login
   → Tenant ID: cole o UUID recebido
   → E-mail e senha: os cadastrados
   → O backend valida e retorna o JWT; o frontend salva o token e abre /dashboard

3. Dashboard
   → Busca GET /consultas?date=<hoje> com Bearer token
   → Exibe cards de totais e próximas consultas

4. Consultas → "Nova Consulta"
   → Preencha paciente, profissional e data/hora
   → POST /consultas → a consulta aparece na tabela

5. Atualizar status
   → Dropdown na linha → "Em andamento", "Finalizado", etc.
   → PATCH /consultas/:id/estado

6. Cancelar
   → Botão lixeira → DELETE /consultas/:id
   → O status muda para "Cancelada"

7. Logout
   → Botão "Sair" na barra lateral → token removido → redirecionamento para /login
```

### API

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| POST | /auth/register | — | Cria tenant + usuário |
| POST | /auth/login | — | Retorna JWT |
| GET | /consultas | JWT | Lista consultas do tenant |
| POST | /consultas | JWT | Cria consulta |
| GET | /consultas/:id | JWT | Detalhe de consulta |
| PATCH | /consultas/:id/estado | JWT | Transição de estado |
| DELETE | /consultas/:id | JWT | Cancelamento lógico |
| GET | /patients | JWT | Lista pacientes |
| POST | /patients | JWT | Cria paciente |
| GET | /health | — | Health check |

**Payload de login:**

```json
{ "tenantId": "uuid", "email": "usuario@exemplo.com", "password": "senha" }
```

**Payload de criação de consulta:**

```json
{
  "patient_name": "Maria Silva",
  "professional": "Dr. Carlos Mendes",
  "room": "Consultório 1",
  "scheduled_time": "2026-03-19T14:00:00.000Z",
  "notes": "Retorno"
}
```

---

## Integrantes

- Isabella Almeida
- Lucas Fortuna
- Murilo de Jesus
- Maria Eduarda Andrade
- Alef Sena

## Instituição

SENAI Candeias

## Professor orientador

Adalberto Santana

---

## Notas técnicas

### Correções aplicadas em relação ao código original

| # | Problema original | Arquivo modificado | Correção |
|---|---|---|---|
| NC1 | tenantId via header não autenticado | `src/app.ts` | CORS adicionado; o tenant vem 100% do JWT |
| NC3 | RLS sem NULLIF (exceção em vez de fail-closed) | `migrations/004_*.sql` | NULLIF em todas as policies |
| — | Login sem campo tenantId | `pages/LoginPage.tsx` | Campo UUID + preenchimento automático pós-registro |
| — | Register sem mapeamento correto | `pages/PrimeiroAcessoPage.tsx` | Mapeamento correto + exibição do tenantId |
| — | Sem chamadas HTTP reais | `app/lib/api.ts` | Cliente centralizado com JWT automático |
| — | Sem AuthContext / rotas abertas | `context/AuthContext.tsx` + `App.tsx` | Estado global + ProtectedRoute |
| — | Dashboard fixo (hardcoded) | `pages/DashboardPage.tsx` | GET /consultas real |
| — | ConsultasPage sem CRUD | `pages/ConsultasPage.tsx` | Criar, listar, atualizar, cancelar |
| — | Sidebar sem logout | `layouts/InstitutionLayout.tsx` | Botão Sair via `useAuth().logout()` |
| — | index.html com caminho errado | `index.html` | `/src/main.tsx` → `/main.tsx` |
| — | Sem proxy Vite | `vite.config.ts` | Proxy para /consultas, /auth, /patients, /health |
| — | /consultas inexistente no backend | Novos arquivos | routes + controller + migration |

### Garantias de segurança preservadas

- `authMiddleware` inalterado, aplicado em todas as rotas protegidas.
- `tenantMiddleware` inalterado, com flag `settled`, ciclo de vida correto e circuit breaker.
- `tenantId` nunca vem de header HTTP; é sempre extraído do JWT verificado pelo backend.
- `errorHandler` sem double-release (não gerencia o pool).
- RLS fail-closed: NULLIF retorna 0 linhas, em vez de exceção, quando `app.tenant_id` não está definido.
