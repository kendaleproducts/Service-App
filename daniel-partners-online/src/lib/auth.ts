import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "dpo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type Role = "client" | "staff";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set");
  return secret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(userId: number, role: Role, expiresAt: number): string {
  return createHmac("sha256", getSecret()).update(`dpo:${userId}:${role}:${expiresAt}`).digest("hex");
}

export function createSessionToken(userId: number, role: Role): { value: string; expires: Date } {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return {
    value: `${userId}.${role}.${expiresAt}.${sign(userId, role, expiresAt)}`,
    expires: new Date(expiresAt),
  };
}

export type SessionClaims = { userId: number; role: Role };

export function verifySessionToken(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  const [idStr, role, expStr, hmac] = token.split(".");
  if (!idStr || !role || !expStr || !hmac) return null;
  if (role !== "client" && role !== "staff") return null;
  const userId = Number(idStr);
  const expiresAt = Number(expStr);
  if (!Number.isInteger(userId) || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const expected = Buffer.from(sign(userId, role, expiresAt), "hex");
  const actual = Buffer.from(hmac, "hex");
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? { userId, role } : null;
}
