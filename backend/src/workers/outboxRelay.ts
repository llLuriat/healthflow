import 'dotenv/config';
import pool from '../db/pool';
import { createClient } from 'redis';

type OutboxEventRow = {
  id: string;
  tenant_id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: any;
  created_at: Date;
};

const BATCH_SIZE = 100;
const DELAY_MS = 1000;
const RELAY_ID = process.env.OUTBOX_RELAY_ID ?? 'default';
const REDIS_URL = process.env.REDIS_URL;

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis(): Promise<ReturnType<typeof createClient> | null> {
  if (!REDIS_URL) return null;
  if (redisClient?.isOpen) return redisClient;
  if (redisClient && !redisClient.isOpen) {
    redisClient = null;
  }

  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => {
    console.error(
      JSON.stringify({
        worker: 'outboxRelay',
        level: 'error',
        msg: 'redis_error',
        message: (err as any)?.message,
      })
    );
    redisClient = null;
  });
  client.on('end', () => {
    redisClient = null;
  });
  await client.connect();
  redisClient = client;
  return client;
}

function flattenPayload(value: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    out.payload = JSON.stringify(value ?? null);
    return out;
  }

  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (v === null) out[k] = 'null';
    else if (typeof v === 'string') out[k] = v;
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = String(v);
    else out[k] = JSON.stringify(v);
  }
  return out;
}

export async function publishEvent(ev: OutboxEventRow): Promise<void> {
  const redis = await getRedis();
  if (!redis) return; // não quebra worker se Redis não estiver configurado

  const stream = `events:${ev.aggregate_type}`;
  const fields: Record<string, string> = {
    event_id: ev.id,
    id: ev.id,
    tenant_id: ev.tenant_id,
    aggregate_type: ev.aggregate_type,
    aggregate_id: ev.aggregate_id,
    event_type: ev.event_type,
    created_at: new Date(ev.created_at).toISOString(),
    ...flattenPayload(ev.payload),
  };

  await redis.xAdd(
    stream,
    '*',
    fields,
    {
      TRIM: {
        strategy: 'MAXLEN',
        strategyModifier: '~',
        threshold: 100000,
      },
    }
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCursor(): Promise<{ lastCreatedAt: Date; lastId: string }> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      last_created_at: Date;
      last_event_id: string;
    }>(
      `
        SELECT last_created_at, last_event_id
        FROM outbox_relay_cursor
        WHERE relay_id = $1
      `,
      [RELAY_ID]
    );

    if (result.rows.length === 0) {
      return {
        lastCreatedAt: new Date(0),
        lastId: '00000000-0000-0000-0000-000000000000',
      };
    }

    return {
      lastCreatedAt: new Date(result.rows[0].last_created_at),
      lastId: result.rows[0].last_event_id,
    };
  } finally {
    client.release();
  }
}

async function saveCursor(lastCreatedAt: Date, lastId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `
        INSERT INTO outbox_relay_cursor (relay_id, last_created_at, last_event_id)
        VALUES ($1, $2, $3::uuid)
        ON CONFLICT (relay_id)
        DO UPDATE SET last_created_at = EXCLUDED.last_created_at,
                      last_event_id = EXCLUDED.last_event_id
      `,
      [RELAY_ID, lastCreatedAt.toISOString(), lastId]
    );
  } finally {
    client.release();
  }
}

export async function runOutboxRelay(): Promise<void> {
  let running = true;

  const shutdown = async () => {
    running = false;
    if (redisClient) {
      await redisClient.quit().catch(() => {});
    }
    await pool.end().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Cursor persistido
  let { lastCreatedAt, lastId } = await loadCursor();

  while (running) {
    const client = await pool.connect();
    try {
      const result = await client.query<OutboxEventRow>(
        `
          SELECT id, tenant_id, aggregate_type, aggregate_id, event_type, payload, created_at
          FROM outbox_events
          WHERE (created_at, id) > ($1::timestamptz, $2::uuid)
          ORDER BY created_at ASC, id ASC
          LIMIT $3
        `,
        [lastCreatedAt.toISOString(), lastId, BATCH_SIZE]
      );

      if (result.rows.length === 0) {
        await sleep(DELAY_MS);
        continue;
      }

      for (const ev of result.rows) {
        // Processamento (placeholder)
        console.log(
          JSON.stringify({
            worker: 'outboxRelay',
            event_id: ev.id,
            id: ev.id,
            tenant_id: ev.tenant_id,
            aggregate_type: ev.aggregate_type,
            aggregate_id: ev.aggregate_id,
            event_type: ev.event_type,
            created_at: ev.created_at,
            payload: ev.payload,
          })
        );

        // Publicação extra (Redis Streams) - não remove o console.log
        try {
          await publishEvent(ev);
        } catch (err: any) {
          console.error(
            JSON.stringify({
              worker: 'outboxRelay',
              level: 'error',
              msg: 'publish_failed',
              id: ev.id,
              stream: `events:${ev.aggregate_type}`,
              message: err?.message,
              code: err?.code,
            })
          );
          // Não avança cursor se não publicou (evita "perda" silenciosa do evento).
          // Em próximo loop, esse evento será reprocessado (at-least-once).
          break;
        }

        // Avança cursor somente após processar + (se configurado) publicar com sucesso
        lastCreatedAt = new Date(ev.created_at);
        lastId = ev.id;
      }

      // Atualiza cursor ao final de cada batch (persistência)
      await saveCursor(lastCreatedAt, lastId);
    } catch (err: any) {
      console.error(
        JSON.stringify({
          worker: 'outboxRelay',
          level: 'error',
          msg: 'poll_failed',
          message: err?.message,
          code: err?.code,
          stack: err?.stack,
        })
      );
      await sleep(DELAY_MS);
    } finally {
      client.release();
    }
  }
}

// Execução direta
if (require.main === module) {
  runOutboxRelay().catch((err) => {
    console.error('[outboxRelay] fatal', err);
    process.exit(1);
  });
}

