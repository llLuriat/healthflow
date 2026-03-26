# HealthFlow — Sistema Integrado

> Backend Express + Frontend React/Vite unificados. Segurança da auditoria 9.8+ preservada.

---

## Estrutura do projeto

```
healthflow/
├── backend/          ← Express + TypeScript (NODE)
│   ├── src/
│   │   ├── app.ts                            ← CORS + todas as rotas registradas
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── patients.controller.ts
│   │   │   └── consultas.controller.ts       ← NOVO
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── patients.routes.ts
│   │   │   └── consultas.routes.ts           ← NOVO
│   │   └── middlewares/
│   │       ├── auth.middleware.ts            ← JWT obrigatório (inalterado)
│   │       └── tenant.middleware.ts          ← TX + RLS + settled flag (inalterado)
│   └── migrations/
│       ├── 001–003_*.sql                     ← originais
│       └── 004_create_consultas_fix_rls.sql  ← NOVO: tabela + fix NULLIF
│
└── frontend/         ← React + Vite + Tailwind
    ├── app/
    │   ├── lib/api.ts                        ← NOVO: cliente HTTP centralizado
    │   ├── context/AuthContext.tsx           ← NOVO: estado global de auth
    │   ├── components/
    │   │   ├── ProtectedRoute.tsx            ← NOVO: guard de rota
    │   │   └── StatusBadge.tsx               ← PATCH: suporte a 'cancelled'
    │   ├── layouts/InstitutionLayout.tsx     ← PATCH: botão logout real
    │   ├── App.tsx                           ← PATCH: AuthProvider + ProtectedRoute
    │   └── pages/
    │       ├── LoginPage.tsx                 ← PATCH: campo tenantId + chamada real
    │       ├── PrimeiroAcessoPage.tsx        ← PATCH: register real + exibe tenantId
    │       ├── DashboardPage.tsx             ← PATCH: dados reais do backend
    │       └── ConsultasPage.tsx             ← PATCH: CRUD completo via /consultas
    ├── index.html                            ← PATCH: referência corrigida para main.tsx
    └── vite.config.ts                        ← PATCH: proxy para backend em dev
```

---

## Pré-requisitos

- Node.js 20+
- pnpm (frontend) ou npm (backend)
- PostgreSQL 14+

---

## Setup em 5 passos

### 1. Banco de dados

```bash
# Crie o banco como superuser
psql -U postgres -c "CREATE DATABASE healthflow;"

# Execute as migrations em ordem
psql -U postgres -d healthflow -f backend/migrate.sql
psql -U postgres -d healthflow -f backend/migrations/001_create_outbox_events.sql
psql -U postgres -d healthflow -f backend/migrations/002_create_outbox_relay_cursor.sql
psql -U postgres -d healthflow -f backend/migrations/003_hardening_multi_tenant.sql
psql -U postgres -d healthflow -f backend/migrations/004_create_consultas_fix_rls.sql
```

### 2. Backend — configurar .env

```bash
cd backend/
cp .env.example .env
```

Edite `.env` com seus valores:

```env
PORT=3000
DATABASE_URL=postgres://app_user:yourpassword@localhost:5432/healthflow
JWT_SECRET=use_um_segredo_forte_com_pelo_menos_32_chars
JWT_EXPIRES_IN=1h
CORS_ORIGINS=http://localhost:5173
ENABLE_UNSAFE_TENANT=false
```

### 3. Backend — instalar e rodar

```bash
cd backend/
npm install
npm run dev
# → http://localhost:3000
# → GET http://localhost:3000/health → {"status":"ok"}
```

### 4. Frontend — configurar

```bash
cd frontend/
cp .env.example .env
# VITE_API_URL deixe em branco para usar o proxy (recomendado em dev)
```

### 5. Frontend — instalar e rodar

```bash
cd frontend/
pnpm install   # ou npm install
pnpm dev       # ou npm run dev
# → http://localhost:5173
```

---

## Fluxo completo de teste

```
1. Acesse: http://localhost:5173/primeiro-acesso
   → Preencha: nome da clínica + segmento → e-mail + senha
   → O backend cria tenant + user → retorna tenantId
   → A tela exibe o UUID com botão "Copiar" — GUARDE ESTE ID

2. Acesse: http://localhost:5173/login
   → Tenant ID: cole o UUID recebido
   → E-mail e Senha: os que você cadastrou
   → Backend valida → retorna JWT
   → Frontend salva token, redireciona para /dashboard

3. Dashboard (dados reais)
   → Busca GET /consultas?date=<hoje> com Bearer token
   → Exibe cards de totais e próximas consultas

4. Consultas → "Nova Consulta"
   → Preencha paciente, profissional, data/hora
   → POST /consultas → consulta aparece na tabela

5. Atualizar status
   → Dropdown na linha → "Em andamento", "Finalizado", etc.
   → PATCH /consultas/:id/estado → atualiza na tabela

6. Cancelar
   → Botão lixeira → DELETE /consultas/:id
   → Status muda para "Cancelada"

7. Logout
   → Botão "Sair" na sidebar → token removido → redirect /login
```

---

## API endpoints

| Método | Endpoint                  | Auth? | Descrição                        |
|--------|---------------------------|-------|----------------------------------|
| POST   | /auth/register            | —     | Cria tenant + user               |
| POST   | /auth/login               | —     | Retorna JWT                      |
| GET    | /consultas                | JWT   | Lista consultas do tenant        |
| POST   | /consultas                | JWT   | Cria consulta                    |
| GET    | /consultas/:id            | JWT   | Detalhe de consulta              |
| PATCH  | /consultas/:id/estado     | JWT   | Transição de estado              |
| DELETE | /consultas/:id            | JWT   | Cancelamento lógico              |
| GET    | /patients                 | JWT   | Lista pacientes                  |
| POST   | /patients                 | JWT   | Cria paciente                    |
| GET    | /health                   | —     | Health check                     |

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

## Correções aplicadas vs. código original

| # | Problema original | Arquivo modificado | Correção |
|---|---|---|---|
| NC1 | tenantId via header não-autenticado | `src/app.ts` | CORS adicionado; tenant vem 100% do JWT |
| NC3 | RLS sem NULLIF (exception em vez de fail-closed) | `migrations/004_*.sql` | NULLIF em todas as policies |
| — | Login sem campo tenantId | `pages/LoginPage.tsx` | Campo UUID + preenchimento automático pós-registro |
| — | Register sem mapeamento correto | `pages/PrimeiroAcessoPage.tsx` | Mapeamento correto + exibição do tenantId |
| — | Sem chamadas HTTP reais | `app/lib/api.ts` | Cliente centralizado com JWT automático |
| — | Sem AuthContext / rotas abertas | `context/AuthContext.tsx` + `App.tsx` | Estado global + ProtectedRoute |
| — | Dashboard hardcoded | `pages/DashboardPage.tsx` | GET /consultas real |
| — | ConsultasPage sem CRUD | `pages/ConsultasPage.tsx` | Criar, listar, atualizar, cancelar |
| — | Sidebar sem logout | `layouts/InstitutionLayout.tsx` | Botão Sair via useAuth().logout() |
| — | index.html com caminho errado | `index.html` | /src/main.tsx → /main.tsx |
| — | Sem proxy Vite | `vite.config.ts` | Proxy /consultas, /auth, /patients, /health |
| — | /consultas inexistente no backend | Novos arquivos | routes + controller + migration |

### Garantias da auditoria — preservadas integralmente

- `authMiddleware` — **inalterado**, aplicado em todas as rotas protegidas
- `tenantMiddleware` — **inalterado**, `settled` flag + lifecycle correto + circuit breaker
- `tenantId` nunca vem de header HTTP — sempre extraído do JWT verificado pelo backend
- `errorHandler` — sem double-release (não gerencia pool)
- RLS fail-closed — NULLIF garante 0 rows em vez de exception quando `app.tenant_id` não definido
