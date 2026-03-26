import { NextFunction, Request, Response } from 'express';

function isUnsafeTenantEnabled(): boolean {
  const raw = process.env.ENABLE_UNSAFE_TENANT;
  if (raw && raw.trim()) return raw.trim().toLowerCase() === 'true';
  // default: true em dev, false em prod
  return process.env.NODE_ENV !== 'production';
}

function base64UrlDecode(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function extractTenantIdFromJwtMock(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) return undefined;

  const token = header.slice(7).trim();
  const parts = token.split('.');
  if (parts.length < 2) return undefined;

  const payloadJson = base64UrlDecode(parts[1]);
  if (!payloadJson) return undefined;

  try {
    const payload = JSON.parse(payloadJson) as any;
    const tenantId = payload?.tenantId ?? payload?.tenant_id;
    return typeof tenantId === 'string' && tenantId.trim() ? tenantId : undefined;
  } catch {
    return undefined;
  }
}

export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const reqAny = req as any;

  // Não sobrescreve tenantId se já estiver definido por outro middleware.
  if (typeof reqAny.tenantId === 'string' && reqAny.tenantId.trim()) {
    next();
    return;
  }

  // Ponto para auth real: se um middleware de auth já validou e colocou tenantId, usamos como fonte confiável.
  const authTenant = reqAny.auth?.tenantId;
  if (typeof authTenant === 'string' && authTenant.trim()) {
    reqAny.tenantId = authTenant.trim();
    next();
    return;
  }

  if (isUnsafeTenantEnabled()) {
    const jwtMockTenant = extractTenantIdFromJwtMock(req);
    if (jwtMockTenant) {
      reqAny.tenantId = jwtMockTenant;
    }
  }

  next();
}

