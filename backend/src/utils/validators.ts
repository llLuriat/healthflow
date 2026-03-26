/**
 * validators.ts — Funções de validação reutilizáveis
 *
 * Centraliza validações de email, UUID, password e outros campos
 * para uso consistente em todos os controllers
 */

// UUID validator using regex pattern (RFC 4122)
function validateUUIDFormat(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// ─── Email ────────────────────────────────────────────────────────────────
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateEmail(email: unknown, fieldName = "email"): string {
  if (!isValidEmail(email)) {
    throw new ValidationError(fieldName, `${fieldName} inválido`);
  }
  return email.toLowerCase().trim();
}

// ─── UUID ─────────────────────────────────────────────────────────────────
export function isValidUUID(id: unknown): id is string {
  return typeof id === "string" && validateUUIDFormat(id);
}

export function validateUUIDField(id: unknown, fieldName = "id"): string {
  if (!isValidUUID(id)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} deve ser um UUID válido`,
    );
  }
  return id;
}

// ─── String obrigatória ───────────────────────────────────────────────────
export function validateRequiredString(
  value: unknown,
  fieldName: string,
  minLength = 1,
  maxLength = Infinity,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(fieldName, `${fieldName} é obrigatório`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new ValidationError(
      fieldName,
      `${fieldName} deve ter no mínimo ${minLength} caracteres`,
    );
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      fieldName,
      `${fieldName} não pode exceder ${maxLength} caracteres`,
    );
  }

  return trimmed;
}

// ─── String opcional ──────────────────────────────────────────────────────
export function validateOptionalString(
  value: unknown,
  fieldName: string,
  maxLength = Infinity,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new ValidationError(fieldName, `${fieldName} deve ser uma string`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      fieldName,
      `${fieldName} não pode exceder ${maxLength} caracteres`,
    );
  }

  return trimmed;
}

// ─── Password ──────────────────────────────────────────────────────────────
export function validatePassword(password: unknown, minLength = 8): string {
  if (typeof password !== "string" || password.length < minLength) {
    throw new ValidationError(
      "password",
      `Senha deve ter no mínimo ${minLength} caracteres`,
    );
  }
  return password;
}

// ─── ISO 8601 DateTime ─────────────────────────────────────────────────────
export function validateISODateTime(
  value: unknown,
  fieldName = "datetime",
): string {
  if (typeof value !== "string") {
    throw new ValidationError(fieldName, `${fieldName} deve ser uma string`);
  }

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(
        fieldName,
        `${fieldName} deve ser uma data ISO 8601 válida`,
      );
    }
  } catch {
    throw new ValidationError(
      fieldName,
      `${fieldName} deve ser uma data ISO 8601 válida`,
    );
  }

  return value;
}

// ─── Número opcional ──────────────────────────────────────────────────────
export function validateOptionalNumber(
  value: unknown,
  fieldName: string,
  min = -Infinity,
  max = Infinity,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const num = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(num)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} deve ser um número válido`,
    );
  }

  if (num < min || num > max) {
    throw new ValidationError(
      fieldName,
      `${fieldName} deve estar entre ${min} e ${max}`,
    );
  }

  return num;
}
