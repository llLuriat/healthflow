-- Cursor persistence for outbox relay workers

CREATE TABLE IF NOT EXISTS outbox_relay_cursor (
  relay_id text PRIMARY KEY,
  last_created_at timestamptz NOT NULL,
  last_event_id uuid NOT NULL
);

