import { Response, NextFunction } from 'express';
import { PoolClient } from 'pg';
import pool from '../db/pool';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/http';

export interface TenantRequest extends AuthRequest {
  db: PoolClient;
}

/**
 * TX OFICIAL (fonte única de verdade)
 * SOURCE OF TRUTH FOR TRANSACTIONS
 *
 * Este middleware é o modelo oficial de transação/tenant para rotas multi-tenant:
 * - garante BEGIN/COMMIT/ROLLBACK por request
 * - injeta `req.db` (PoolClient) para uso nos handlers
 * - aplica `SET LOCAL` via `set_config(..., true)` dentro da transação
 *
 * Importante: não use em conjunto com `dbMiddleware` (src/middlewares/db.ts) no mesmo fluxo,
 * para evitar drift e dupla gestão de transação.
 */

// Limite in-memory de requisições simultâneas por tenant.
// Observacao: por ser em-memory, em multiplos processos nao ha coordinacao entre instancias.
const tenantInFlight = new Map<string, number>();
const MAX_CONCURRENT_DEFAULT = 20;

// Circuit breaker simples por tenant (in-memory).
// Serve para proteger o sistema contra falhas repetidas (ex: problemas no banco/policies).
type TenantCircuit = {
  failures: number;
  windowStartMs: number;
  openUntilMs: number;
};
const tenantCircuit = new Map<string, TenantCircuit>();
const CIRCUIT_FAILURES_DEFAULT = 8;
const CIRCUIT_WINDOW_MS_DEFAULT = 60_000;
const CIRCUIT_COOLDOWN_MS_DEFAULT = 30_000;

function getCircuit(tenantId: string): TenantCircuit {
  const existing = tenantCircuit.get(tenantId);
  if (existing) return existing;
  const created: TenantCircuit = {
    failures: 0,
    windowStartMs: Date.now(),
    openUntilMs: 0,
  };
  tenantCircuit.set(tenantId, created);
  return created;
}

function isCircuitOpen(circuit: TenantCircuit, nowMs: number): boolean {
  return circuit.openUntilMs > nowMs;
}

function recordFailure(tenantId: string): void {
  const nowMs = Date.now();
  const rawThreshold = process.env.TENANT_CIRCUIT_FAILURES;
  const rawWindowMs = process.env.TENANT_CIRCUIT_WINDOW_MS;
  const rawCooldownMs = process.env.TENANT_CIRCUIT_COOLDOWN_MS;

  const threshold =
    rawThreshold && rawThreshold.trim() ? Number(rawThreshold) : CIRCUIT_FAILURES_DEFAULT;
  const windowMs =
    rawWindowMs && rawWindowMs.trim()
      ? Number(rawWindowMs)
      : CIRCUIT_WINDOW_MS_DEFAULT;
  const cooldownMs =
    rawCooldownMs && rawCooldownMs.trim()
      ? Number(rawCooldownMs)
      : CIRCUIT_COOLDOWN_MS_DEFAULT;

  if (!Number.isFinite(threshold) || threshold <= 0) return;

  const circuit = getCircuit(tenantId);
  if (nowMs - circuit.windowStartMs > windowMs) {
    circuit.failures = 1;
    circuit.windowStartMs = nowMs;
    return;
  }

  circuit.failures += 1;

  if (circuit.failures >= threshold) {
    circuit.openUntilMs = nowMs + cooldownMs;
    // reseta contagem para nao "acumular" durante cooldown
    circuit.failures = 0;
    circuit.windowStartMs = nowMs;
  }
}

function recordSuccess(tenantId: string): void {
  const circuit = getCircuit(tenantId);
  circuit.failures = 0;
  circuit.windowStartMs = Date.now();
}

export async function tenantMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.auth?.tenantId) {
    sendError(res, 401, 'unauthorized', 'Tenant não identificado');
    return;
  }

  // Evita que o middleware prenda/solte a mesma transação duas vezes na mesma requisição.
  const reqAny = req as any;
  const tenantId = req.auth.tenantId;

  if (reqAny.__tenantTxManaged) {
    // Se já foi gerenciado neste request, apenas continua (mantém o comportamento atual).
    next();
    return;
  }
  reqAny.__tenantTxManaged = true;

  // Protecao contra falhas repetidas (circuit breaker).
  const circuit = getCircuit(tenantId);
  const nowMs = Date.now();
  if (isCircuitOpen(circuit, nowMs)) {
    const retryAfterSec = Math.max(1, Math.ceil((circuit.openUntilMs - nowMs) / 1000));
    res
      .status(503)
      .set('Retry-After', String(retryAfterSec))
      .json({ error: { code: 'service_unavailable', message: 'Tenant temporariamente indisponível' } });
    return;
  }

  // Rate limit por concorrência (somente para requests com tenantId).
  const rawMax = process.env.TENANT_MAX_CONCURRENT_REQUESTS;
  const maxConcurrent =
    rawMax && rawMax.trim() ? Number(rawMax) : MAX_CONCURRENT_DEFAULT;

  // Se configurado <= 0, desabilita.
  const enableLimit = Number.isFinite(maxConcurrent) && maxConcurrent > 0;

  let acquiredPermit = false;
  if (enableLimit) {
    const current = tenantInFlight.get(tenantId) ?? 0;
    if (current >= maxConcurrent) {
      sendError(res, 429, 'too_many_requests', 'Muitas requisições concorrentes');
      return;
    }
    tenantInFlight.set(tenantId, current + 1);
    acquiredPermit = true;
  }

  let client: PoolClient | undefined;
  let ownsClient = false;
  let startedTx = true; // Sempre true, simplifica a lógica

  try {
    // Se req.db já existir, este middleware reutiliza o client para evitar dupla conexão.
    // Caso contrário, ele cria uma nova conexão e será responsável por liberar.
    if (reqAny.db) {
      client = reqAny.db as PoolClient;
      startedTx = false; // Se já tem client, não iniciamos transação
    } else {
      client = await pool.connect();
      ownsClient = true;
      startedTx = true; // Vamos iniciar transação
    }

    // Inicia transação se necessário
    // PostgreSQL trata BEGIN aninhados como SAVEPOINT automaticamente
    if (startedTx) {
      await client.query('BEGIN');
    }

    const statementTimeoutMs = Number(process.env.STATEMENT_TIMEOUT_MS ?? '3000');
    const lockTimeoutMs = Number(process.env.LOCK_TIMEOUT_MS ?? '1000');
    if (Number.isFinite(statementTimeoutMs) && statementTimeoutMs > 0) {
      await client.query(`SELECT set_config('statement_timeout', $1, true)`, [
        `${Math.trunc(statementTimeoutMs)}ms`,
      ]);
    }
    if (Number.isFinite(lockTimeoutMs) && lockTimeoutMs > 0) {
      await client.query(`SELECT set_config('lock_timeout', $1, true)`, [
        `${Math.trunc(lockTimeoutMs)}ms`,
      ]);
    }

    // Aplica o tenant no contexto da transação (SET LOCAL).
    await client.query(
      `SELECT set_config('app.tenant_id', $1, true)`,
      [tenantId]
    );
  } catch (err: any) {
    console.error('[tenantMiddleware] falha ao iniciar/ativar transação:', err.message);
    // Se este middleware começou uma transação, tenta desfazer.
    if (startedTx && client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    if (ownsClient && client) {
      client.release();
    }
    if (acquiredPermit) {
      const current = tenantInFlight.get(tenantId) ?? 1;
      tenantInFlight.set(tenantId, Math.max(0, current - 1));
    }
    sendError(res, 500, 'internal_error', 'Erro ao iniciar transação');
    return;
  }

  // client estará definido aqui porque a inicialização/queries acima passaram no `try`.
  (req as TenantRequest).db = client!;
  (req as any).__txManaged = true;

  // Flag garante que COMMIT/ROLLBACK + release ocorra exatamente uma vez,
  // mesmo que 'finish' e 'close' disparem no mesmo ciclo (keep-alive).
  let settled = false;
  const finalize = (shouldRollback: boolean) => {
    if (settled) return;
    settled = true;

    if (acquiredPermit) {
      const current = tenantInFlight.get(tenantId) ?? 1;
      tenantInFlight.set(tenantId, Math.max(0, current - 1));
    }

    // Só finaliza a transação se ela foi iniciada por este middleware.
    if (startedTx) {
      const op = shouldRollback ? 'ROLLBACK' : 'COMMIT';
      client!
        .query(op)
        .catch((err) => {
          console.error(`[tenantMiddleware] erro no ${op}:`, err.message);
          // Erros no finalize significam falha real de infraestrutura.
          recordFailure(tenantId);
        })
        .finally(() => {
          if (ownsClient) client.release();
        });
      return;
    }

    // Se não iniciamos transação, apenas liberamos a conexão se fomos nós que criamos.
    if (ownsClient) client.release();
  };

  // 'finish' dispara quando a resposta foi enviada.
  // Rollback apenas em falhas 5xx (mantém consistência com erros transitórios/infra).
  res.on('finish', () => {
    const status = res.statusCode;
    if (status >= 500) recordFailure(tenantId);
    else if (status < 400) recordSuccess(tenantId);
    finalize(status >= 500);
  });

  // 'close' dispara quando a conexão HTTP foi encerrada antes do finish (ex: abort).
  res.on('close', () => {
    // abort/close antes do finish tende a indicar falha.
    // Em keep-alive, 'close' pode ocorrer mesmo após 'finish', então só contamos se
    // ainda não houve finalização.
    if (!settled) {
      recordFailure(tenantId);
    }
    finalize(true);
  });

  next();
}
