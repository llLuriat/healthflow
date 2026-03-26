import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import {
  ValidationError,
  validateEmail,
  validateRequiredString,
  validatePassword,
} from '../utils/validators';
import { sendError } from '../utils/http';

const JWT_SECRET    = process.env.JWT_SECRET as string;
const SALT_ROUNDS   = 10;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { tenantName, email, password } = req.body;

    const validTenantName = validateRequiredString(tenantName, 'tenantName', 3, 100);
    const validEmail      = validateEmail(email);
    const validPassword   = validatePassword(password, 8);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tenantId = uuidv4();
      await client.query('INSERT INTO tenants (id, name) VALUES ($1, $2)', [
        tenantId,
        validTenantName,
      ]);

      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);

      const userId       = uuidv4();
      const passwordHash = await bcrypt.hash(validPassword, SALT_ROUNDS);

      // Primeiro usuário do tenant recebe role 'owner' automaticamente
      await client.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'owner')`,
        [userId, tenantId, validEmail, passwordHash],
      );

      await client.query('COMMIT');
      res.status(201).json({ tenantId, userId, email: validEmail });
    } catch (err: any) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        sendError(res, 409, 'conflict', 'Email já cadastrado neste tenant');
        return;
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, 'validation_error', err.message);
      return;
    }
    console.error('[register]', err.message);
    sendError(res, 500, 'internal_error', 'Erro interno ao registrar');
  }
}

// ─── LOGIN (com tenantId explícito — mantido para compatibilidade) ─────────────
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { tenantId, email, password } = req.body;

    const validTenantId = validateRequiredString(tenantId, 'tenantId', 36, 36);
    const validEmail    = validateEmail(email);

    if (!password) throw new ValidationError('password', 'Senha é obrigatória');

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validTenantId)) {
      sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
      return;
    }

    const client = await pool.connect();
    let startedTx = false;
    let committed = false;
    try {
      await client.query('BEGIN');
      startedTx = true;
      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [validTenantId]);

      const result = await client.query(
        `SELECT id, tenant_id, password_hash, role
         FROM users WHERE tenant_id = $1 AND email = $2`,
        [validTenantId, validEmail],
      );

      if (result.rows.length === 0) {
        sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
        return;
      }

      const user  = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
        return;
      }

      const token = jwt.sign(
        { userId: user.id, tenantId: user.tenant_id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      await client.query('COMMIT');
      committed = true;
      res.json({ token });
    } catch (err: any) {
      throw err;
    } finally {
      if (startedTx && !committed) {
        await client.query('ROLLBACK').catch(() => {});
      }
      client.release();
    }
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, 'validation_error', err.message);
      return;
    }
    console.error('[login]', err.message);
    sendError(res, 500, 'internal_error', 'Erro interno ao fazer login');
  }
}

// ─── LOGIN POR EMAIL (sem tenantId — UX simplificada) ─────────────────────────
// Busca o tenant pelo email. Se houver múltiplos tenants com o mesmo email,
// retorna conflito com lista de tenants para seleção explícita.
export async function loginByEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const validEmail = validateEmail(email);
    if (!password) throw new ValidationError('password', 'Senha é obrigatória');

    // Busca sem RLS (superuser pool não existe aqui; usamos pool normal sem set_config)
    // A query filtra apenas pelo email — expõe somente dados do próprio usuário.
    const client = await pool.connect();
    try {
      // Busca todos os usuários com este email (pode existir em múltiplos tenants)
      const result = await client.query(
        `SELECT u.id, u.tenant_id, u.password_hash, u.role, t.name AS tenant_name
         FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE lower(u.email) = lower($1)
         LIMIT 10`,
        [validEmail],
      );

      if (result.rows.length === 0) {
        // Resposta genérica — não revela se email existe ou não
        sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
        return;
      }

      // Verifica a senha em todos os matches (constant-time em relação ao número de tenants)
      let authenticated: typeof result.rows[0] | null = null;
      for (const row of result.rows) {
        const valid = await bcrypt.compare(password, row.password_hash);
        if (valid) { authenticated = row; break; }
      }

      if (!authenticated) {
        sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
        return;
      }

      // Caso raro: mesmo email em múltiplos tenants com a mesma senha
      const validMatches = [];
      for (const row of result.rows) {
        const valid = await bcrypt.compare(password, row.password_hash);
        if (valid) validMatches.push(row);
      }

      if (validMatches.length > 1) {
        // Retorna lista de tenants para o usuário escolher
        res.status(409).json({
          error: {
            code: 'tenant_conflict',
            message: 'Email associado a múltiplas clínicas. Selecione uma.',
          },
          tenants: validMatches.map((r) => ({
            tenantId: r.tenant_id,
            tenantName: r.tenant_name,
          })),
        });
        return;
      }

      const user  = authenticated;
      const token = jwt.sign(
        { userId: user.id, tenantId: user.tenant_id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      res.json({ token, tenantId: user.tenant_id, tenantName: user.tenant_name });
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, 'validation_error', err.message);
      return;
    }
    console.error('[loginByEmail]', err.message);
    sendError(res, 500, 'internal_error', 'Erro interno ao fazer login');
  }
}
