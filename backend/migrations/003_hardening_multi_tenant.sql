-- Incremental hardening for multi-tenant SaaS

-- 1) fail-closed helper: always cast via NULLIF
-- Policies below assume tenant_id stored as uuid/text; adjust casts as needed.

-- Patients: metadata columns
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Composite PK (tenant_id, id)
-- Assumes existing PK is patients_pkey on (id). If different, adjust manually.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patients_pkey' AND conrelid = 'patients'::regclass
  ) THEN
    ALTER TABLE patients DROP CONSTRAINT patients_pkey;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore
END $$;

DO $$
BEGIN
  ALTER TABLE patients ADD PRIMARY KEY (tenant_id, id);
EXCEPTION WHEN duplicate_object THEN
  -- ignore
END $$;

-- Trigger to update updated_at + row_version (append-only semantics optional via deleted_at)
CREATE OR REPLACE FUNCTION trg_set_metadata() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  NEW.row_version = COALESCE(OLD.row_version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'patients_set_metadata'
  ) THEN
    CREATE TRIGGER patients_set_metadata
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_metadata();
  END IF;
END $$;

-- 2) RLS fail-closed using NULLIF(current_setting)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND policyname = 'patients_tenant_isolation'
  ) THEN
    CREATE POLICY patients_tenant_isolation
      ON patients
      USING (tenant_id::text = NULLIF(current_setting('app.tenant_id', true), ''))
      WITH CHECK (tenant_id::text = NULLIF(current_setting('app.tenant_id', true), ''));
  END IF;
END $$;

-- 3) Idempotency table RLS
ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS tenant_id text;

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'idempotency_keys' AND policyname = 'idempotency_tenant_isolation'
  ) THEN
    CREATE POLICY idempotency_tenant_isolation
      ON idempotency_keys
      USING (tenant_id::text = NULLIF(current_setting('app.tenant_id', true), ''))
      WITH CHECK (tenant_id::text = NULLIF(current_setting('app.tenant_id', true), ''));
  END IF;
END $$;

-- 4) outbox_relay_cursor nullable fields (cursor can be empty)
ALTER TABLE outbox_relay_cursor
  ALTER COLUMN last_created_at DROP NOT NULL,
  ALTER COLUMN last_event_id DROP NOT NULL;

