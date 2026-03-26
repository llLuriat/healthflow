import crypto from "crypto";
import type { Request } from "express";
import type { PoolClient } from "pg";

export const IDEMPOTENCY_TABLE = "idempotency_keys";

const TTL_MS_DEFAULT = 24 * 60 * 60 * 1000; // 24h

export function getIdempotencyKey(req: Request): string | undefined {
  const v = req.header("Idempotency-Key") ?? req.header("x-idempotency-key");
  if (typeof v !== "string") return undefined;
  const key = v.trim();
  if (!key) return undefined;
  return key.slice(0, 512);
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function computeRequestHash(req: Request): string {
  return sha256Hex(
    JSON.stringify({
      method: req.method,
      path: (req as any).originalUrl || req.path,
      body: (req as any).body ?? null,
    }),
  );
}

export function getTtlMs(): number {
  const raw = process.env.IDEMPOTENCY_TTL_MS;
  const ttl = raw && raw.trim() ? Number(raw) : TTL_MS_DEFAULT;
  return Number.isFinite(ttl) && ttl > 0 ? ttl : TTL_MS_DEFAULT;
}

export async function ensureIdempotencySchema(_db: PoolClient): Promise<void> {}
