import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/http';

function isRetryableError(err: any): boolean {
  const code = err?.code;
  const message = typeof err?.message === 'string' ? err.message.toLowerCase() : '';

  // Node/network
  if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') return true;
  if (code === 'ECONNRESET' || code === 'EPIPE') return true;

  // Postgres
  // deadlock_detected
  if (code === '40P01') return true;
  // query_canceled (ex: statement_timeout)
  if (code === '57014') return true;

  if (message.includes('timeout')) return true;
  if (message.includes('connection reset')) return true;
  if (message.includes('deadlock')) return true;

  return false;
}

export async function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (res.headersSent) {
    next(err);
    return;
  }

  const correlationId =
    typeof (req as any).correlationId === 'string' ? (req as any).correlationId : 'unknown';

  const retryable = isRetryableError(err);

  // Log interno completo com correlation_id (sem vazar detalhes na resposta).
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'unhandled_error',
      correlation_id: correlationId,
      retryable,
      code: err?.code,
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    })
  );

  sendError(res, 500, 'internal_error', 'Erro interno');
}

