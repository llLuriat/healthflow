-- HealthFlow – Migration 004
-- Cria tabela consultas + corrige RLS com NULLIF (fix NC3 da auditoria 9.8+)
-- Execute como superuser no banco healthflow

-- ─── TABELA ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_name    TEXT        NOT NULL,
  professional    TEXT        NOT NULL,
  room            TEXT        NOT NULL DEFAULT '',
  scheduled_time  TIMESTAMPTZ NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','in-progress','delayed','finished','cancelled')),
  delay_minutes   INT         NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_tenant_time
  ON consultas (tenant_id, scheduled_time);

GRANT SELECT, INSERT, UPDATE, DELETE ON consultas TO app_user;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON consultas;

-- NULLIF: se app.tenant_id não estiver definido, retorna NULL → 0 rows (fail-closed)
-- Sem NULLIF: ''::UUID lança exception (NC3 da auditoria)
CREATE POLICY tenant_isolation ON consultas
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

-- ─── CORRIGE POLICIES EXISTENTES COM NULLIF ───────────────────────────────────

DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  USING  (id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
  WITH CHECK (id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

DROP POLICY IF EXISTS tenant_isolation ON patients;
CREATE POLICY tenant_isolation ON patients
  USING  (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::UUID);

-- ─── VERIFICAÇÃO ──────────────────────────────────────────────────────────────
SELECT relname AS tabela, relrowsecurity AS rls, relforcerowsecurity AS forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('tenants','users','patients','consultas');
