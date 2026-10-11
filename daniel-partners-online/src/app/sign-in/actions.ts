"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, createSessionToken, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/data";

function safeNext(next: string, fallback: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    redirect(`/sign-in?error=1&next=${encodeURIComponent(next)}`);
  }

  await setSessionCookie(user.id, user.role);
  redirect(safeNext(next, user.role === "staff" ? "/firm" : "/portal"));
}

export async function setSessionCookie(userId: number, role: "client" | "staff") {
  const { value, expires } = createSessionToken(userId, role);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/");
}
