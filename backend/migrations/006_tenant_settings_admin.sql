-- HealthFlow – Migration 006
-- Adiciona campos de configuração ao tenant + tabela de admins internos

-- ─── COLUNAS ADICIONAIS EM TENANTS ───────────────────────────────────────────
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS segment       TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS email_contact TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563EB',
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── ADMINS INTERNOS DA PLATAFORMA ───────────────────────────────────────────
-- Separados dos users de clínica — autenticação independente
CREATE TABLE IF NOT EXISTS admins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Não aplica RLS em admins — autenticação é separada e gerenciada internamente
GRANT SELECT, INSERT, UPDATE ON admins TO app_user;

-- Índice para lookup de admin por email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (lower(email));
