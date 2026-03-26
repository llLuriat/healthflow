import { PoolClient } from 'pg';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      tenantId?: string;
      db?: PoolClient;
    }
  }
}

export {};

