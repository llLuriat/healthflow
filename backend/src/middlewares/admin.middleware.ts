import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminJwtPayload } from '../controllers/admin.controller';
import { sendError } from '../utils/http';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AdminRequest extends Request {
  admin?: AdminJwtPayload;
}

export function adminAuthMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    sendError(res, 401, 'unauthorized', 'Token ausente');
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AdminJwtPayload;
    if (payload.role !== 'superadmin') {
      sendError(res, 403, 'forbidden', 'Acesso negado');
      return;
    }
    req.admin = payload;
    next();
  } catch {
    sendError(res, 401, 'unauthorized', 'Token inválido ou expirado');
  }
}
