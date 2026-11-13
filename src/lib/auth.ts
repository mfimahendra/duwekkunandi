import { createHash, createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "duwek_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} belum diset`);
  return value;
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export function checkPin(input: string): boolean {
  return safeEqual(input, getEnv("APP_PIN"));
}

export function createSessionToken(): string {
  return createHmac("sha256", getEnv("APP_SECRET")).update("owner").digest("hex");
}

export function isValidSessionToken(token?: string): boolean {
  if (!token) return false;
  try {
    return safeEqual(token, createSessionToken());
  } catch {
    return false;
  }
}
