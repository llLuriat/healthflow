import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/http';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definida no .env');
}

export interface JwtPayload {
  userId:   string;
  tenantId: string;
  role:     string;
}

export interface AuthRequest extends Request {
  auth?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    sendError(res, 401, 'unauthorized', 'Token ausente');
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    req.auth = payload;
    next();
  } catch {
    sendError(res, 401, 'unauthorized', 'Token inválido ou expirado');
  }
}
