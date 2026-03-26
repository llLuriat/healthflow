import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida no .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? '20'),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? '30000'),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS ?? '5000'),
});

// Loga erros de conexões idle — NÃO encerra o processo.
// O pool recria conexões automaticamente; process.exit aqui derrubaria o servidor
// por erros transitórios de rede que o pg-pool já trata internamente.
pool.on('error', (err) => {
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'pg_pool_idle_error',
      message: (err as any)?.message,
      code: (err as any)?.code,
    }),
  );
});

export default pool;
