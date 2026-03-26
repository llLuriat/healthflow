import { NextFunction, Request, Response } from 'express';

const inFlightByTenant = new Map<string, number>();
const DEFAULT_MAX = 20;

export function tenantConcurrency(req: Request, res: Response, next: NextFunction): void {
  const tenantId = typeof (req as any).tenantId === 'string' ? (req as any).tenantId : undefined;
  if (!tenantId || !tenantId.trim()) {
    // Sem tenantId, não aplica limite (não altera comportamento atual).
    next();
    return;
  }

  const rawMax = process.env.MAX_CONCURRENT_PER_TENANT;
  const max = rawMax && rawMax.trim() ? Number(rawMax) : DEFAULT_MAX;
  const enabled = Number.isFinite(max) && max > 0;
  if (!enabled) {
    next();
    return;
  }

  const key = tenantId.trim();
  const current = inFlightByTenant.get(key) ?? 0;
  if (current >= max) {
    res.status(429).json({
      error: { code: 'too_many_requests', message: 'Concorrencia excedida para tenant' },
      retry_after: 1,
    });
    return;
  }

  inFlightByTenant.set(key, current + 1);
  let settled = false;

  const release = () => {
    if (settled) return;
    settled = true;
    const now = (inFlightByTenant.get(key) ?? 1) - 1;
    if (now <= 0) inFlightByTenant.delete(key);
    else inFlightByTenant.set(key, now);
  };

  res.on('finish', release);
  res.on('close', release);

  next();
}

