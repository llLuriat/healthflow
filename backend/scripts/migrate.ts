/**
 * scripts/migrate.ts
 * Runner de migrations — executa em ordem todos os arquivos .sql da pasta /migrations
 * Cria tabela migrations_log para controle idempotente (não reexecuta migrations já aplicadas)
 *
 * Uso:
 *   npx ts-node scripts/migrate.ts          (desenvolvimento)
 *   node dist/scripts/migrate.js            (produção após build)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function run(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    // Tabela de controle — idempotente
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_log (
        id          SERIAL      PRIMARY KEY,
        filename    TEXT        NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Lê migrations em ordem lexicográfica (001_, 002_, ...)
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Verifica se já foi aplicada
      const already = await client.query(
        'SELECT 1 FROM migrations_log WHERE filename = $1',
        [file],
      );
      if (already.rows.length > 0) {
        console.log(`[migrate] ✓ skip (já aplicada): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      console.log(`[migrate] → aplicando: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations_log (filename) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`[migrate] ✓ ok: ${file}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`[migrate] ✗ FALHA em ${file}:`, err.message);
        throw err;
      }
    }

    console.log('[migrate] Todas as migrations aplicadas com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('[migrate] Erro fatal:', err.message);
  process.exit(1);
});
