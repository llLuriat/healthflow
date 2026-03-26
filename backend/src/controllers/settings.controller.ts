import { Response } from 'express';
import { TenantRequest } from '../middlewares/tenant.middleware';
import {
  ValidationError,
  validateRequiredString,
  validateOptionalString,
  validateEmail,
} from '../utils/validators';
import { sendError } from '../utils/http';

const VALID_SEGMENTS = ['medico', 'dental', 'veterinaria', 'oftalmologia'] as const;
type Segment = typeof VALID_SEGMENTS[number];

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function getSettings(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const tenantId = req.auth!.tenantId;

  const result = await req.db.query(
    `SELECT id, name, segment, phone, address, email_contact, primary_color, logo_url
     FROM tenants WHERE id = $1`,
    [tenantId],
  );

  if (result.rows.length === 0) {
    sendError(res, 404, 'not_found', 'Clínica não encontrada');
    return;
  }

  res.json(result.rows[0]);
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateSettings(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  try {
    const tenantId = req.auth!.tenantId;
    const { name, segment, phone, address, email_contact, primary_color } = req.body;

    const validName = validateRequiredString(name, 'name', 3, 100);

    if (segment && !VALID_SEGMENTS.includes(segment as Segment)) {
      sendError(res, 400, 'validation_error', `segment inválido. Valores aceitos: ${VALID_SEGMENTS.join(', ')}`);
      return;
    }

    const validPhone        = validateOptionalString(phone,         'phone',         30);
    const validAddress      = validateOptionalString(address,       'address',       255);
    const validEmail        = email_contact ? validateEmail(email_contact, 'email_contact') : null;
    const validColor        = validateOptionalString(primary_color, 'primary_color', 20);

    const result = await req.db.query(
      `UPDATE tenants
       SET name = $2, segment = $3, phone = $4, address = $5,
           email_contact = $6, primary_color = $7, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, segment, phone, address, email_contact, primary_color, logo_url`,
      [tenantId, validName, segment ?? null, validPhone, validAddress, validEmail, validColor],
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
