import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export type OutboxEventInput = {
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
};

export async function appendOutboxEvent(
  db: PoolClient,
  event: OutboxEventInput
): Promise<void> {
  await db.query(
    `
      INSERT INTO outbox_events
        (id, tenant_id, aggregate_type, aggregate_id, event_type, payload)
      VALUES
        ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      uuidv4(),
      event.tenantId,
      event.aggregateType,
      event.aggregateId,
      event.eventType,
      JSON.stringify(event.payload ?? null),
    ]
  );
}

