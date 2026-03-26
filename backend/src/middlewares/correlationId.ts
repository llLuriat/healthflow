import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function correlationIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Gera um correlation id por requisição para correlacionar logs.
  req.correlationId = randomUUID();
  next();
}

