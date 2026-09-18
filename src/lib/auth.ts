import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

function sign(expiresAt: number): string {
  const hmac = createHmac("sha256", getSecret())
    .update(`session:${expiresAt}`)
    .digest("hex");
  return `${expiresAt}.${hmac}`;
}

export function createSessionToken(): { value: string; expires: Date } {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return { value: sign(expiresAt), expires: new Date(expiresAt) };
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAtStr, hmac] = token.split(".");
  if (!expiresAtStr || !hmac) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = createHmac("sha256", getSecret())
    .update(`session:${expiresAt}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(hmac, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  const expectedBuf = Buffer.from(expected);
  const candidateBuf = Buffer.from(candidate);
  if (expectedBuf.length !== candidateBuf.length) {
    // still run a comparison to avoid short-circuit timing leak
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(expectedBuf, candidateBuf);
}

export { COOKIE_NAME };
