import type { PoolClient } from 'pg';
import pool from '../db/pool';

// Infra única para obter conexão. Reusa o pool já existente em `src/db/pool.ts`
// para evitar múltiplos pools no mesmo processo.
export { pool };

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

