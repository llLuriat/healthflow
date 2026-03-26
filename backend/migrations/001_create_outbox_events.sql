-- Outbox Pattern (append-only)
-- Goal: persist events in the same DB transaction as domain writes (future).

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY,
  tenant_id text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Efficient polling / ordering for publisher worker
CREATE INDEX IF NOT EXISTS idx_outbox_events_created_at_id
  ON outbox_events (created_at, id);

