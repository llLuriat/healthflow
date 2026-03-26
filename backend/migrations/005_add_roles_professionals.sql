-- HealthFlow – Migration 005
-- Adiciona: role em users, tabela professionals, índices críticos
-- Execute como superuser no banco healthflow

-- ─── ROLE NO USUÁRIO ──────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'professional', 'receptionist'));

-- ─── TABELA PROFESSIONALS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS professionals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  specialty   TEXT        NOT NULL DEFAULT '' CHECK (char_length(specialty) <= 100),
  email       TEXT        CHECK (email ~* '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'),
  phone       TEXT        CHECK (char_length(phone) <= 30),
  room        TEXT        NOT NULL DEFAULT '' CHECK (char_length(room) <= 100),
  status      TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professionals_tenant
  ON professionals (tenant_id);

CREATE INDEX IF NOT EXISTS idx_professionals_tenant_status
  ON professionals (tenant_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON professionals TO app_user;

-- Trigger updated_at (reutiliza função trg_set_metadata se existir, senão cria inline)
CREATE OR REPLACE FUNCTION trg_professionals_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'professionals_updated_at'
  ) THEN
    CREATE TRIGGER professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW EXECUTE FUNCTION trg_professionals_updated_at();
  END IF;
END $$;

-- ─── RLS PROFESSIONALS ────────────────────────────────────────────────────────
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON professionals;
CREATE POLICY tenant_isolation ON professionals
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

-- ─── ÍNDICES CRÍTICOS AUSENTES ────────────────────────────────────────────────
-- Login: busca por email é O(n) sem índice
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_tenant_email
  ON users (tenant_id, email);

-- Busca de tenant por email (login sem tenantId)
CREATE INDEX IF NOT EXISTS idx_users_email_only
  ON users (lower(email));

-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_tenant
  ON patients (tenant_id);

-- ─── VERIFICAÇÃO ──────────────────────────────────────────────────────────────
SELECT relname AS tabela, relrowsecurity AS rls, relforcerowsecurity AS forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('tenants', 'users', 'patients', 'consultas', 'professionals');
