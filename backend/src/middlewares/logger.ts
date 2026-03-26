import { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startMs = Date.now();

  res.on('finish', () => {
    const correlationId =
      (req as any).correlationId && typeof (req as any).correlationId === 'string'
        ? (req as any).correlationId
        : 'unknown';

    const tenantId =
      typeof (req as any).tenantId === 'string' && (req as any).tenantId.trim()
        ? (req as any).tenantId.trim()
        : undefined;

    const durationMs = Date.now() - startMs;

    console.log(
      JSON.stringify({
        method: req.method,
        url: (req as any).originalUrl ?? req.url,
        status: res.statusCode,
        duration: durationMs,
        correlation_id: correlationId,
        tenant_id: tenantId,
      })
    );
  });

  next();
}

