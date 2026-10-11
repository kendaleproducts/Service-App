"use server";

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { uploadsDir } from "@/lib/db";
import {
  addDocument,
  addDocumentRequest,
  addEvent,
  assignLawyer,
  bookAppointment,
  buildEngagementTerms,
  clearConflict,
  getLawyer,
  getMatterSummary,
  getService,
  issueInvoice,
  markInvoicePaid,
  sendMessage,
  setAppointmentStatus,
  setEngagementTerms,
  setMatterStatus,
  takenSlots,
} from "@/lib/data";
import { availableSlots } from "@/lib/scheduling";
import { requireUser } from "@/lib/session";
import type { MatterStatus } from "@/lib/types";

const STATUSES: MatterStatus[] = ["intake_received", "consultation_scheduled", "engagement_pending", "in_progress", "client_review", "completed", "closed", "cancelled"];

async function staffAndMatter(formData: FormData) {
  const user = await requireUser("staff");
  const matterId = Number(formData.get("matter_id"));
  const matter = getMatterSummary(matterId);
  if (!matter) throw new Error("Matter not found.");
  return { user, matter };
}

function done(matterId: number) {
  revalidatePath(`/firm/matters/${matterId}`);
  revalidatePath("/firm");
  revalidatePath("/firm/matters");
}

export async function updateStatus(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const status = String(formData.get("status")) as MatterStatus;
  if (!STATUSES.includes(status) || status === matter.status) return;
  setMatterStatus(matter.id, status, user.name);
  done(matter.id);
}

export async function reassignLawyer(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const lawyerId = Number(formData.get("lawyer_id")) || null;
  if (lawyerId && !getLawyer(lawyerId)) return;
  assignLawyer(matter.id, lawyerId, user.name);
  done(matter.id);
}

export async function markConflictCleared(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  if (!matter.conflict_cleared_at) clearConflict(matter.id, user.name);
  done(matter.id);
}

export async function sendEngagementLetter(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const service = getService(matter.service_id)!;
  const feeCents = Math.round(Number(formData.get("fee_dollars")) * 100) || service.fee_cents;
  const terms = String(formData.get("terms") ?? "").trim() || buildEngagementTerms(matter, service, matter.lawyer_name);
  setEngagementTerms(matter.id, terms);
  addEvent({ matter_id: matter.id, kind: "engagement", body: "Engagement letter sent to client.", actor_name: user.name, actor_role: "staff" });
  if (formData.get("with_retainer") === "yes") {
    issueInvoice({ matter_id: matter.id, description: `Retainer — ${service.name}`, kind: "retainer", amount_cents: feeCents, actor: user });
  }
  if (matter.status !== "engagement_pending") setMatterStatus(matter.id, "engagement_pending", user.name);
  done(matter.id);
}

export async function staffMessage(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const body = String(formData.get("body") ?? "").trim();
  if (body) sendMessage(matter.id, user, body.slice(0, 4000));
  done(matter.id);
}

export async function addInternalNote(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const body = String(formData.get("body") ?? "").trim();
  if (body) addEvent({ matter_id: matter.id, kind: "note", body: `Internal: ${body.slice(0, 2000)}`, actor_name: user.name, actor_role: "staff", visible_to_client: false });
  done(matter.id);
}

export async function requestDocument(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  addDocumentRequest(matter.id, label.slice(0, 200), String(formData.get("instructions") ?? "").trim().slice(0, 1000) || null, user);
  done(matter.id);
}

export async function staffUpload(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const kind = String(formData.get("kind")) === "firm_final" ? "firm_final" : "firm_draft";
  const file = formData.get("file");
  const pasted = String(formData.get("content") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) throw new Error("File is larger than 10 MB.");
    const storedName = `${Date.now()}-${randomBytes(6).toString("hex")}${path.extname(file.name).toLowerCase().slice(0, 10)}`;
    await fs.writeFile(path.join(uploadsDir, storedName), Buffer.from(await file.arrayBuffer()));
    addDocument({ matter_id: matter.id, name: (title || file.name).slice(0, 200), kind, mime_type: file.type || "application/octet-stream", size_bytes: file.size, stored_name: storedName, content: null, uploaded_by: user, requires_client_review: kind === "firm_draft" });
  } else if (pasted) {
    addDocument({ matter_id: matter.id, name: (title || "Draft").slice(0, 200) + ".txt", kind, mime_type: "text/plain", size_bytes: Buffer.byteLength(pasted), stored_name: null, content: pasted, uploaded_by: user, requires_client_review: kind === "firm_draft" });
  } else {
    return;
  }
  if (kind === "firm_draft" && matter.status === "in_progress") setMatterStatus(matter.id, "client_review", user.name);
  done(matter.id);
}

export async function staffBookMeeting(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const slot = String(formData.get("slot") ?? "");
  const purpose = String(formData.get("purpose") ?? "Video meeting").trim().slice(0, 120) || "Video meeting";
  const open = availableSlots(takenSlots(matter.lawyer_id), 8, 30).flatMap((d) => d.slots.map((s) => s.iso));
  if (!open.includes(slot)) redirect(`/firm/matters/${matter.id}?book_error=1`);
  bookAppointment({ matter_id: matter.id, lawyer_id: matter.lawyer_id, starts_at: slot, duration_minutes: 30, purpose, actor: user });
  if (matter.status === "intake_received") setMatterStatus(matter.id, "consultation_scheduled", user.name);
  done(matter.id);
}

export async function setMeetingStatus(formData: FormData) {
  const user = await requireUser("staff");
  const id = Number(formData.get("appointment_id"));
  const status = String(formData.get("status"));
  if (status !== "completed" && status !== "cancelled" && status !== "scheduled") return;
  setAppointmentStatus(id, status, user);
  const matterId = Number(formData.get("matter_id"));
  if (matterId) done(matterId);
  revalidatePath("/firm/calendar");
}

export async function staffIssueInvoice(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  const amount = Math.round(Number(formData.get("amount_dollars")) * 100);
  const description = String(formData.get("description") ?? "").trim();
  const kind = String(formData.get("kind") ?? "fee");
  if (!amount || amount <= 0 || !description) return;
  issueInvoice({ matter_id: matter.id, description: description.slice(0, 200), kind: ["retainer", "fee", "disbursement"].includes(kind) ? kind : "fee", amount_cents: amount, taxable: kind !== "disbursement", actor: user });
  done(matter.id);
}

export async function staffMarkPaid(formData: FormData) {
  const { user, matter } = await staffAndMatter(formData);
  markInvoicePaid(Number(formData.get("invoice_id")), user);
  done(matter.id);
}
