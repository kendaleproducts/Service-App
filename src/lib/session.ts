import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken, type SessionRole } from "@/lib/auth";

export async function getSessionRole(): Promise<SessionRole | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return (await getSessionRole()) === "admin";
}

/** Throws if the current session isn't admin-tier. Call at the top of destructive server actions. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Admin access required for this action.");
  }
}
