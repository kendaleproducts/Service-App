"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRole, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const role = resolveRole(password);
  if (!role) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const { value, expires } = createSessionToken(role);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });

  redirect(next && next.startsWith("/") ? next : "/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
