import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import pool from '../db/pool';
import { ValidationError, validateEmail, validatePassword } from '../utils/validators';
import { sendError } from '../utils/http';

const JWT_SECRET     = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
const SALT_ROUNDS    = 10;

export interface AdminJwtPayload {
  adminId: string;
  role: 'superadmin';
}

// ─── LOGIN ADMIN ──────────────────────────────────────────────────────────────
export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const validEmail = validateEmail(email);
    if (!password) throw new ValidationError('password', 'Senha é obrigatória');

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash FROM admins WHERE lower(email) = lower($1)',
        [validEmail],
      );

      if (result.rows.length === 0) {
        sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
        return;
      }

      const admin = result.rows[0];
      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) {
        sendError(res, 401, 'unauthorized', 'Credenciais inválidas');
        return;
      }

      const token = jwt.sign(
        { adminId: admin.id, role: 'superadmin' } as AdminJwtPayload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      res.json({ token });
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, 'validation_error', err.message);
      return;
    }
    console.error('[adminLogin]', err.message);
    sendError(res, 500, 'internal_error', 'Erro interno');
  }
}

// ─── STATS GLOBAIS ────────────────────────────────────────────────────────────
export async function getAdminStats(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const [tenants, users, consultas] = await Promise.all([
      client.query('SELECT COUNT(*) AS total FROM tenants'),
      client.query('SELECT COUNT(*) AS total FROM users'),
      client.query(
        `SELECT COUNT(*) AS total FROM consultas
         WHERE scheduled_time::date = CURRENT_DATE`,
      ),
    ]);

    res.json({
      totalInstitutions: Number(tenants.rows[0].total),
      totalUsers:        Number(users.rows[0].total),
      consultasHoje:     Number(consultas.rows[0].total),
    });
  } finally {
    client.release();
  }
}

// ─── LISTAR CLIENTES ──────────────────────────────────────────────────────────
export async function listClients(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
         t.id, t.name, t.segment, t.email_contact, t.created_at,
         COUNT(DISTINCT u.id)::int    AS total_users,
         COUNT(DISTINCT c.id)::int   AS total_consultas
       FROM tenants t
       LEFT JOIN users u       ON u.tenant_id = t.id
       LEFT JOIN consultas c   ON c.tenant_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
    );
    res.json(result.rows);
  } finally {
    client.release();
  }
}
