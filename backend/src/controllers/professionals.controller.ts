import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TenantRequest } from '../middlewares/tenant.middleware';
import {
  ValidationError,
  validateRequiredString,
  validateOptionalString,
} from '../utils/validators';
import { sendError } from '../utils/http';

// ─── CREATE ───────────────────────────────────────────────────────────────────
export async function createProfessional(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  try {
    const { name, specialty, email, phone, room } = req.body;

    const validName      = validateRequiredString(name, 'name', 1, 255);
    const validSpecialty = validateOptionalString(specialty, 'specialty', 100) ?? '';
    const validEmail     = validateOptionalString(email, 'email', 255);
    const validPhone     = validateOptionalString(phone, 'phone', 30);
    const validRoom      = validateOptionalString(room, 'room', 100) ?? '';

    const id       = uuidv4();
    const tenantId = req.auth!.tenantId;

    const result = await req.db.query(
      `INSERT INTO professionals (id, tenant_id, name, specialty, email, phone, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tenant_id, name, specialty, email, phone, room, status, created_at, updated_at`,
      [id, tenantId, validName, validSpecialty, validEmail, validPhone, validRoom],
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, 'validation_error', err.message);
      return;
    }
    throw err;
  }
}

// ─── LIST ─────────────────────────────────────────────────────────────────────
export async function listProfessionals(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const tenantId = req.auth!.tenantId;
  const includeInactive = req.query.includeInactive === 'true';

  const result = await req.db.query(
    `SELECT id, tenant_id, name, specialty, email, phone, room, status, created_at, updated_at
     FROM professionals
     WHERE tenant_id = $1
       ${includeInactive ? '' : "AND status = 'active'"}
     ORDER BY name ASC`,
    [tenantId],
  );

  res.json(result.rows);
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function getProfessional(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const { id }   = req.params;
  const tenantId = req.auth!.tenantId;

  const result = await req.db.query(
    `SELECT id, tenant_id, name, specialty, email, phone, room, status, created_at, updated_at
     FROM professionals WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id],
  );

  if (result.rows.length === 0) {
    sendError(res, 404, 'not_found', 'Profissional não encontrado');
    return;
  }

  res.json(result.rows[0]);
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateProfessional(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  try {
    const { id }   = req.params;
    const tenantId = req.auth!.tenantId;
    const { name, specialty, email, phone, room, status } = req.body;

    // Verifica existência antes de atualizar
    const existing = await req.db.query(
      'SELECT id FROM professionals WHERE tenant_id = $1 AND id = $2 FOR UPDATE',
      [tenantId, id],
    );
    if (existing.rows.length === 0) {
      sendError(res, 404, 'not_found', 'Profissional não encontrado');
      return;
    }

    const validName      = validateRequiredString(name, 'name', 1, 255);
    const validSpecialty = validateOptionalString(specialty, 'specialty', 100) ?? '';
    const validEmail     = validateOptionalString(email, 'email', 255);
    const validPhone     = validateOptionalString(phone, 'phone', 30);
    const validRoom      = validateOptionalString(room, 'room', 100) ?? '';

    const validStatus = status === 'inactive' ? 'inactive' : 'active';

    const result = await req.db.query(
      `UPDATE professionals
       SET name = $3, specialty = $4, email = $5, phone = $6, room = $7,
           status = $8, updated_at = NOW()
       WHERE tenant_id = $1 AND id = $2
       RETURNING id, tenant_id, name, specialty, email, phone, room, status, created_at, updated_at`,
      [tenantId, id, validName, validSpecialty, validEmail, validPhone, validRoom, validStatus],
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, 'validation_error', err.message);
      return;
    }
    throw err;
  }
}

// ─── DELETE (soft delete — muda status para inactive) ─────────────────────────
export async function deleteProfessional(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const { id }   = req.params;
  const tenantId = req.auth!.tenantId;

  const result = await req.db.query(
    `UPDATE professionals
     SET status = 'inactive', updated_at = NOW()
     WHERE tenant_id = $1 AND id = $2
     RETURNING id, status`,
    [tenantId, id],
  );

  if (result.rows.length === 0) {
    sendError(res, 404, 'not_found', 'Profissional não encontrado');
    return;
  }

  res.json(result.rows[0]);
}
