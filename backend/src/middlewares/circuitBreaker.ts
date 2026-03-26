import { NextFunction, Request, Response } from 'express';

type CircuitState = {
  windowStartMs: number;
  failures: number;
  openUntilMs: number;
};

const byTenant = new Map<string, CircuitState>();

const WINDOW_MS = 60_000;
const LIMIT = 10;

function getState(tenantId: string): CircuitState {
  const existing = byTenant.get(tenantId);
  if (existing) return existing;
  const created: CircuitState = {
    windowStartMs: Date.now(),
    failures: 0,
    openUntilMs: 0,
  };
  byTenant.set(tenantId, created);
  return created;
}

export function tenantCircuitBreaker(req: Request, res: Response, next: NextFunction): void {
  const tenantId = typeof (req as any).tenantId === 'string' ? (req as any).tenantId : undefined;
  if (!tenantId || !tenantId.trim()) {
    // Sem tenantId, não interfere (não altera comportamento atual).
    next();
    return;
  }

  const key = tenantId.trim();
  const now = Date.now();
  const state = getState(key);

  if (state.openUntilMs > now) {
    res.status(503).json({
      error: { code: 'service_unavailable', message: 'Circuito aberto para tenant' },
      retry_after: 60,
    });
    return;
  }

  res.on('finish', () => {
    // Conta apenas erros 5xx
    if (res.statusCode < 500) return;

    const now2 = Date.now();
    const s = getState(key);

    // Janela móvel simples
    if (now2 - s.windowStartMs > WINDOW_MS) {
      s.windowStartMs = now2;
      s.failures = 1;
      s.openUntilMs = 0;
      return;
    }

    s.failures += 1;
    if (s.failures >= LIMIT) {
      s.openUntilMs = now2 + WINDOW_MS; // cooldown 60s
      s.failures = 0;
      s.windowStartMs = now2;
    }
  });

  next();
}

