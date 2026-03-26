import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { TenantRequest } from "../middlewares/tenant.middleware";
import { appendOutboxEvent } from "../infra/outbox";
import {
  ValidationError,
  validateRequiredString,
  validateOptionalString,
} from "../utils/validators";
import { sendError } from "../utils/http";

export async function createPatient(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  try {
    const { name, birth_date, notes } = req.body;

    // Validações centralizadas
    const validName = validateRequiredString(name, "name", 1, 255);
    const validNotes = validateOptionalString(notes, "notes", 500);

    const id = uuidv4();
    const tenantId = req.auth!.tenantId;

    const result = await req.db.query(
      `INSERT INTO patients (id, tenant_id, name, birth_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, name, birth_date, notes, created_at`,
      [id, tenantId, validName, birth_date || null, validNotes],
    );

    // Outbox (mesma transação): garante consistência dados/eventos.
    await appendOutboxEvent(req.db, {
      tenantId,
      aggregateType: "patient",
      aggregateId: id,
      eventType: "patient.created",
      payload: {
        id,
        name: validName,
        birth_date: birth_date || null,
      },
    });

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err instanceof ValidationError) {
      sendError(res, err.status, "validation_error", err.message);
      return;
    }
    throw err;
  }
}

export async function listPatients(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const tenantId = req.auth!.tenantId;
  const result = await req.db.query(
    `SELECT id, tenant_id, name, birth_date, notes, created_at
     FROM patients
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId],
  );

  res.json(result.rows);
}

export async function getPatient(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;

  const result = await req.db.query(
    `SELECT id, tenant_id, name, birth_date, notes, created_at
     FROM patients
     WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id],
  );

  if (result.rows.length === 0) {
    sendError(res, 404, "not_found", "Paciente não encontrado");
    return;
  }

  res.json(result.rows[0]);
}
