import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken, type Role } from "@/lib/auth";
import { getUserById, type User } from "@/lib/data";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const claims = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!claims) return null;
  const user = getUserById(claims.userId);
  if (!user || user.role !== claims.role) return null;
  return user;
}

/** Redirects to sign-in unless a user with the given role is signed in. */
export async function requireUser(role: Role, nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const target = nextPath ?? (role === "staff" ? "/firm" : "/portal");
    redirect(`/sign-in?next=${encodeURIComponent(target)}`);
  }
  if (user.role !== role) {
    redirect(user.role === "staff" ? "/firm" : "/portal");
  }
  return user;
}
