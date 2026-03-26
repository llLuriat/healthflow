import { NextFunction, Request, Response } from 'express';

let inFlight = 0;
const DEFAULT_MAX = 100;

export function globalBackpressure(req: Request, res: Response, next: NextFunction): void {
  const rawMax = process.env.MAX_GLOBAL_CONCURRENT;
  const max =
    rawMax && rawMax.trim() ? Number(rawMax) : DEFAULT_MAX;

  // Se configurado <= 0, desabilita.
  const enabled = Number.isFinite(max) && max > 0;
  if (!enabled) {
    next();
    return;
  }

  if (inFlight >= max) {
    res.status(503).json({
      error: { code: 'service_unavailable', message: 'Servidor ocupado' },
      retry_after: 1,
    });
    return;
  }

  inFlight += 1;
  let settled = false;

  const release = () => {
    if (settled) return;
    settled = true;
    inFlight = Math.max(0, inFlight - 1);
  };

  res.on('finish', release);
  res.on('close', release);

  next();
}

