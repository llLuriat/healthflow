import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { TenantRequest } from "../middlewares/tenant.middleware";
import { appendOutboxEvent } from "../infra/outbox";
import {
  ValidationError,
  validateRequiredString,
  validateOptionalString,
  validateOptionalNumber,
  validateISODateTime,
} from "../utils/validators";
import { sendError } from "../utils/http";

type ConsultaStatus =
  | "scheduled"
  | "in-progress"
  | "delayed"
  | "finished"
  | "cancelled";

const VALID_ESTADOS: ConsultaStatus[] = [
  "scheduled",
  "in-progress",
  "delayed",
  "finished",
  "cancelled",
];

// Máquina de estados — transições permitidas (auditoria: sem transições arbitrárias)
const VALID_TRANSITIONS: Record<ConsultaStatus, ConsultaStatus[]> = {
  scheduled: ["in-progress", "delayed", "cancelled"],
  "in-progress": ["finished", "delayed", "cancelled"],
  delayed: ["in-progress", "finished", "cancelled"],
  finished: [],
  cancelled: [],
};

function isValidStatus(s: string): s is ConsultaStatus {
  return VALID_ESTADOS.includes(s as ConsultaStatus);
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export async function createConsulta(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  try {
    const { patient_name, professional, room, scheduled_time, notes } =
      req.body;

    // Validações centralizadas
    const validPatientName = validateRequiredString(
      patient_name,
      "patient_name",
      1,
      255,
    );
    const validProfessional = validateRequiredString(
      professional,
      "professional",
      1,
      255,
    );
    const validRoom = validateOptionalString(room, "room", 100);
    const validScheduledTime = validateISODateTime(
      scheduled_time,
      "scheduled_time",
    );
    const validNotes = validateOptionalString(notes, "notes", 500);

    const id = uuidv4();
    const tenantId = req.auth!.tenantId;

    const result = await req.db.query(
      `INSERT INTO consultas
         (id, tenant_id, patient_name, professional, room, scheduled_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id, tenant_id, patient_name, professional, room,
         scheduled_time, status, delay_minutes, notes, created_at`,
      [
        id,
        tenantId,
        validPatientName,
        validProfessional,
        validRoom,
        validScheduledTime,
        validNotes,
      ],
    );

    await appendOutboxEvent(req.db, {
      tenantId,
      aggregateType: "consulta",
      aggregateId: id,
      eventType: "consulta.created",
      payload: {
        id,
        patient_name: validPatientName,
        professional: validProfessional,
        scheduled_time: validScheduledTime,
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

// ─── LIST ─────────────────────────────────────────────────────────────────────
export async function listConsultas(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const tenantId = req.auth!.tenantId;
  const dateFilter = req.query.date as string | undefined;

  let query = `
    SELECT id, tenant_id, patient_name, professional, room,
           scheduled_time, status, delay_minutes, notes, created_at, updated_at
    FROM consultas
    WHERE tenant_id = $1
  `;
  const params: unknown[] = [tenantId];

  if (dateFilter) {
    query += ` AND scheduled_time::date = $2`;
    params.push(dateFilter);
  }

  query += ` ORDER BY scheduled_time ASC`;

  const result = await req.db.query(query, params);
  res.json(result.rows);
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function getConsulta(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;

  const result = await req.db.query(
    `SELECT id, tenant_id, patient_name, professional, room,
            scheduled_time, status, delay_minutes, notes, created_at, updated_at
     FROM consultas
     WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id],
  );

  if (result.rows.length === 0) {
    sendError(res, 404, "not_found", "Consulta não encontrada");
    return;
  }

  res.json(result.rows[0]);
}

// ─── UPDATE ESTADO ────────────────────────────────────────────────────────────
export async function updateConsultaEstado(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const { estado, delay_minutes } = req.body;
  const tenantId = req.auth!.tenantId;

  if (!estado || !isValidStatus(estado)) {
    sendError(res, 400, "validation_error", `estado inválido. Valores aceitos: ${VALID_ESTADOS.join(", ")}`);
    return;
  }

  const current = await req.db.query(
    `SELECT status FROM consultas WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
    [tenantId, id],
  );

  if (current.rows.length === 0) {
    sendError(res, 404, "not_found", "Consulta não encontrada");
    return;
  }

  const currentStatus = current.rows[0].status as ConsultaStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed.includes(estado)) {
    res.status(400).json({
      error: `Transição inválida: ${currentStatus} → ${estado}`,
      current_status: currentStatus,
      allowed_transitions: allowed,
    });
    return;
  }

  const delayValue =
    typeof delay_minutes === "number" && delay_minutes >= 0 ? delay_minutes : 0;

  const result = await req.db.query(
    `UPDATE consultas
     SET status = $3, delay_minutes = $4, updated_at = NOW()
     WHERE tenant_id = $1 AND id = $2
     RETURNING
       id, tenant_id, patient_name, professional, room,
       scheduled_time, status, delay_minutes, notes, created_at, updated_at`,
    [tenantId, id, estado, delayValue],
  );

  await appendOutboxEvent(req.db, {
    tenantId,
    aggregateType: "consulta",
    aggregateId: id,
    eventType: "consulta.estado_alterado",
    payload: { id, estado_anterior: currentStatus, estado_novo: estado },
  });

  res.json(result.rows[0]);
}

// ─── DELETE (cancelamento lógico — nunca físico) ───────────────────────────────
export async function deleteConsulta(
  req: TenantRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const tenantId = req.auth!.tenantId;

  const current = await req.db.query(
    `SELECT status FROM consultas WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
    [tenantId, id],
  );

  if (current.rows.length === 0) {
    sendError(res, 404, "not_found", "Consulta não encontrada");
    return;
  }

  const currentStatus = current.rows[0].status as ConsultaStatus;

  if (currentStatus === "finished" || currentStatus === "cancelled") {
    sendError(res, 409, "conflict", `Não é possível cancelar consulta com status '${currentStatus}'`);
    return;
  }

  const result = await req.db.query(
    `UPDATE consultas
     SET status = 'cancelled', updated_at = NOW()
     WHERE tenant_id = $1 AND id = $2
     RETURNING id, status, updated_at`,
    [tenantId, id],
  );

  await appendOutboxEvent(req.db, {
    tenantId,
    aggregateType: "consulta",
    aggregateId: id,
    eventType: "consulta.cancelada",
    payload: { id, estado_anterior: currentStatus },
  });

  res.json(result.rows[0]);
}
