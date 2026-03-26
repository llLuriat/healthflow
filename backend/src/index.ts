import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import app from './app';

// ─── Validação de produção ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  if (process.env.ENABLE_UNSAFE_TENANT !== 'false') {
    throw new Error(
      'Config inválida: em produção, defina ENABLE_UNSAFE_TENANT=false.',
    );
  }
  console.log('[startup] production safe-tenant mode ativo');
}

// ─── Migrations automáticas ────────────────────────────────────────────────────
// Executa ANTES de aceitar conexões. Falha fatal encerra o processo (fail-fast).
try {
  const migrateDistPath = path.resolve(__dirname, '..', 'scripts', 'migrate.js');
  const migrateTsPath = path.resolve(__dirname, '..', '..', 'scripts', 'migrate.ts');
  const cmd = fs.existsSync(migrateDistPath)
    ? `node "${migrateDistPath}"`
    : `npx ts-node "${migrateTsPath}"`;

  execSync(cmd, { stdio: 'inherit' });
} catch (err: any) {
  console.error('[startup] Falha nas migrations:', err.message);
  process.exit(1);
}

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`HealthFlow listening on port ${PORT}`);
});

export default app;
