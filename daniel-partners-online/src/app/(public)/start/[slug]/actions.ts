"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { createMatter, createUser, getServiceBySlug, getUserByEmail, pickLawyerFor, takenSlots } from "@/lib/data";
import { availableSlots } from "@/lib/scheduling";
import { getCurrentUser } from "@/lib/session";
import { setSessionCookie } from "@/app/sign-in/actions";

export type IntakeState = { error?: string; fieldErrors?: Record<string, string> } | null;

const personSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a phone number we can reach you at."),
  city: z.string().trim().min(2, "Enter your city or town."),
  in_ontario: z.literal("yes", { error: "Our online service is available to clients in Ontario." }),
  password: z.string().min(8, "Choose a password of at least 8 characters."),
});

export async function submitIntake(_prev: IntakeState, formData: FormData): Promise<IntakeState> {
  const slug = String(formData.get("service_slug") ?? "");
  const service = getServiceBySlug(slug);
  if (!service || !service.active) return { error: "That service is no longer available." };

  const existing = await getCurrentUser();
  if (existing && existing.role === "staff") return { error: "You are signed in to the firm desk. Sign out to submit an intake as a client." };

  const fieldErrors: Record<string, string> = {};

  // 1. About you
  let client = existing;
  if (!client) {
    const parsed = personSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      in_ontario: formData.get("in_ontario"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    } else if (getUserByEmail(parsed.data.email)) {
      fieldErrors.email = "An account already exists for this email. Sign in first, then start the matter from your portal.";
    }
    if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };
    const data = parsed.data!;
    client = createUser({
      email: data.email,
      password_hash: hashPassword(data.password),
      role: "client",
      name: data.name,
      phone: data.phone,
      city: data.city,
      province: "ON",
    });
  }

  // 2. Service questions
  const intake: Record<string, string> = {};
  for (const q of service.questions) {
    const value = String(formData.get(`q_${q.key}`) ?? "").trim();
    if (q.required !== false && !value) fieldErrors[`q_${q.key}`] = "Required.";
    intake[q.key] = value;
  }

  // 3. Conflict check
  const otherParties = String(formData.get("other_parties") ?? "").trim();
  if (formData.get("conflict_confirm") !== "yes") fieldErrors.conflict_confirm = "Please confirm.";

  // 4. Slot
  const slot = String(formData.get("slot") ?? "");
  let appointmentIso: string | null = null;
  if (slot) {
    const lawyer = pickLawyerFor(service.practice_area);
    const open = availableSlots(takenSlots(lawyer?.id ?? null), 8, service.consultation_minutes).flatMap((d) => d.slots.map((s) => s.iso));
    if (!open.includes(slot)) fieldErrors.slot = "That time is no longer available. Please choose another.";
    else appointmentIso = slot;
  }

  // 5. Terms
  if (formData.get("agree") !== "yes") fieldErrors.agree = "Please confirm you have read the notice.";

  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const matter = createMatter({ client: client!, service, intake, other_parties: otherParties || null, appointmentIso });
  if (!existing) await setSessionCookie(client!.id, "client");
  redirect(`/portal/matters/${matter.id}?welcome=1`);
}
