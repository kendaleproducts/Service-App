import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionRole = "user" | "admin";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

function sign(expiresAt: number, role: SessionRole): string {
  const hmac = createHmac("sha256", getSecret())
    .update(`session:${expiresAt}:${role}`)
    .digest("hex");
  return `${expiresAt}.${role}.${hmac}`;
}

export function createSessionToken(role: SessionRole): { value: string; expires: Date } {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return { value: sign(expiresAt, role), expires: new Date(expiresAt) };
}

export function verifySessionToken(token: string | undefined): SessionRole | null {
  if (!token) return null;
  const [expiresAtStr, role, hmac] = token.split(".");
  if (!expiresAtStr || !role || !hmac) return null;
  if (role !== "user" && role !== "admin") return null;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expected = createHmac("sha256", getSecret())
    .update(`session:${expiresAt}:${role}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(hmac, "hex");
  if (expectedBuf.length !== actualBuf.length) return null;
  return timingSafeEqual(expectedBuf, actualBuf) ? role : null;
}

function timingSafeMatch(candidate: string, expected: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const candidateBuf = Buffer.from(candidate);
  if (expectedBuf.length !== candidateBuf.length) {
    // still run a comparison to avoid short-circuit timing leak
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(expectedBuf, candidateBuf);
}

/**
 * Resolves a login password to a role. Checked against two separate
 * passwords: USER_PASSWORD (day-to-day access, required) and
 * ADMIN_PASSWORD (elevated access for destructive actions, optional —
 * admin tier simply doesn't exist until it's set).
 */
export function resolveRole(candidate: string): SessionRole | null {
  const userPassword = process.env.USER_PASSWORD;
  if (!userPassword) {
    throw new Error("USER_PASSWORD environment variable is not set");
  }
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminPassword && timingSafeMatch(candidate, adminPassword)) return "admin";
  if (timingSafeMatch(candidate, userPassword)) return "user";
  return null;
}

export { COOKIE_NAME };
