import { NextFunction, Response } from 'express';
import { TenantRequest } from './tenant.middleware';
import { getClient } from '../infra/db';
import {
  computeRequestHash,
  ensureIdempotencySchema,
  getIdempotencyKey,
  getTtlMs,
  IDEMPOTENCY_TABLE,
  sha256Hex,
} from '../infra/idempotencyStore';

let schemaChecked = false;

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    // fallback minimo: evita quebrar a resposta por falha de serializacao
    return JSON.stringify({ error: 'unserializable_response' });
  }
}

export async function idempotencyMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawKey = getIdempotencyKey(req as any);
  if (!rawKey) {
    next();
    return;
  }

  if (typeof rawKey !== 'string' || !rawKey.trim()) {
    res.status(400).json({ error: 'invalid_idempotency_key' });
    return;
  }

  const tenantId = req.auth?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Tenant não identificado' });
    return;
  }

  // Limite simples para evitar tokens gigantes.
  const key = rawKey.trim().slice(0, 512);

  const idempotencyKeyHash = sha256Hex(key);
  const requestHash = computeRequestHash(req as any);

  // Captura body/JSON para persistir depois (se sucesso).
  let capturedBody: unknown = undefined;
  let captured = false;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  (res as any).json = (body: unknown) => {
    if (!captured) {
      capturedBody = body;
      captured = true;
    }
    return originalJson(body);
  };

  (res as any).send = (body: any) => {
    if (!captured) {
      capturedBody = body;
      captured = true;
    }
    return originalSend(body);
  };

  // Preferir a mesma conexão/transação do request (RLS + app.tenant_id via SET LOCAL).
  // Fallback: abre conexão dedicada e seta app.tenant_id na sessão dentro de uma tx curta.
  const requestDb = (req as any).db;
  const client = requestDb ?? (await getClient());
  const ownsClient = !requestDb;
  let shouldCommitRead = false;

  try {
    if (!schemaChecked) {
      await ensureIdempotencySchema(client);
      schemaChecked = true;
    }

    if (ownsClient) {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
    }

    const existing = await client.query(
      `
      SELECT status_code, response_body, request_hash
      FROM ${IDEMPOTENCY_TABLE}
      WHERE tenant_id = $1 AND key_hash = $2 AND expires_at > now()
      `,
      [tenantId, idempotencyKeyHash]
    );

    if (existing.rows.length > 0 && existing.rows[0].response_body !== null) {
      const row = existing.rows[0];
      if (row.request_hash && row.request_hash !== requestHash) {
        res.status(409).json({ error: 'idempotency_key_mismatch' });
        return;
      }
      // response_body jsonb ja vem como objeto (node-postgres).
      res.status(row.status_code ?? 200).json(row.response_body);
      return;
    }
    shouldCommitRead = true;
  } catch (err: any) {
    if (ownsClient) {
      await client.query('ROLLBACK').catch(() => {});
    }
    // Se falhar a leitura do idempotency, nao alteramos o comportamento atual:
    // segue fluxo normal (sem idempotencia efectiva).
    console.error('[idempotency] leitura falhou:', err.message);
  } finally {
    if (ownsClient) {
      if (shouldCommitRead) {
        await client.query('COMMIT').catch(() => {});
      }
      client.release();
    }
  }

  // 2) persistir resposta apenas em sucesso (nao altera comportamento dos handlers).
  res.on('finish', async () => {
    if (res.statusCode >= 400) return;
    if (!captured) return;

    // Buffer nao vira json automaticamente; convertemos para string.
    const valueForJson =
      typeof Buffer !== 'undefined' && Buffer.isBuffer(capturedBody)
        ? capturedBody.toString('utf8')
        : capturedBody;

    const requestDb2 = (req as any).db;
    const client2 = requestDb2 ?? (await getClient());
    const ownsClient2 = !requestDb2;
    let shouldCommit = false;
    try {
      if (!schemaChecked) {
        await ensureIdempotencySchema(client2);
        schemaChecked = true;
      }

      if (ownsClient2) {
        await client2.query('BEGIN');
        await client2.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
      }

      const ttlMs = getTtlMs();
      const expiresAtIso = new Date(Date.now() + ttlMs).toISOString();

      await client2.query(
        `
          INSERT INTO ${IDEMPOTENCY_TABLE}
            (tenant_id, key_hash, request_hash, status_code, response_body, expires_at)
          VALUES
            ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)
          ON CONFLICT (tenant_id, key_hash)
          DO NOTHING
        `,
        [
          tenantId,
          idempotencyKeyHash,
          requestHash,
          res.statusCode,
          safeJsonStringify(valueForJson),
          expiresAtIso,
        ]
      );
      shouldCommit = true;
    } catch (err: any) {
      if (ownsClient2) {
        await client2.query('ROLLBACK').catch(() => {});
      }
      console.error('[idempotency] persistencia falhou:', err.message);
    } finally {
      if (ownsClient2) {
        if (shouldCommit) {
          await client2.query('COMMIT').catch(() => {});
        }
        client2.release();
      }
    }
  });

  next();
}

