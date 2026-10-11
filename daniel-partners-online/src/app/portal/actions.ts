"use server";

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { uploadsDir } from "@/lib/db";
import {
  addDocument,
  approveDocument,
  bookAppointment,
  getDocument,
  getInvoice,
  getMatter,
  getMatterSummary,
  markInvoicePaid,
  sendMessage,
  setMatterStatus,
  signEngagement,
  takenSlots,
  updateUserProfile,
  listInvoices,
} from "@/lib/data";
import { availableSlots } from "@/lib/scheduling";
import { requireUser } from "@/lib/session";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function ownMatter(matterId: number) {
  const user = await requireUser("client");
  const matter = getMatter(matterId);
  if (!matter || matter.client_id !== user.id) throw new Error("Matter not found.");
  return { user, matter };
}

export async function postMessage(formData: FormData) {
  const matterId = Number(formData.get("matter_id"));
  const body = String(formData.get("body") ?? "").trim();
  const { user } = await ownMatter(matterId);
  if (body.length > 0) sendMessage(matterId, user, body.slice(0, 4000));
  revalidatePath(`/portal/matters/${matterId}`);
}

export async function uploadDocument(formData: FormData) {
  const matterId = Number(formData.get("matter_id"));
  const requestId = Number(formData.get("request_id")) || null;
  const { user } = await ownMatter(matterId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 10 MB.");
  const ext = path.extname(file.name).toLowerCase().slice(0, 10);
  const storedName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  await fs.writeFile(path.join(uploadsDir, storedName), Buffer.from(await file.arrayBuffer()));
  addDocument({
    matter_id: matterId,
    name: file.name.slice(0, 200),
    kind: requestId ? "identification" : "client_upload",
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    stored_name: storedName,
    content: null,
    uploaded_by: user,
    fulfils_request_id: requestId,
  });
  revalidatePath(`/portal/matters/${matterId}`);
}

export async function acceptEngagement(formData: FormData) {
  const matterId = Number(formData.get("matter_id"));
  const signedName = String(formData.get("signed_name") ?? "").trim();
  const { user, matter } = await ownMatter(matterId);
  if (!matter.engagement_terms || matter.engagement_signed_at) return;
  if (signedName.toLowerCase() !== user.name.trim().toLowerCase()) {
    redirect(`/portal/matters/${matterId}?sign_error=1#engagement`);
  }
  signEngagement(matterId, signedName, user);
  maybeStartWork(matterId, user.name);
  revalidatePath(`/portal/matters/${matterId}`);
}

export async function payInvoice(formData: FormData) {
  const invoiceId = Number(formData.get("invoice_id"));
  const invoice = getInvoice(invoiceId);
  if (!invoice || invoice.status !== "due") return;
  const { user } = await ownMatter(invoice.matter_id);
  // Sandbox: no payment processor. Production integrates a trust-compliant
  // processor here and marks the invoice paid from its webhook.
  markInvoicePaid(invoiceId, user);
  maybeStartWork(invoice.matter_id, user.name);
  revalidatePath(`/portal/matters/${invoice.matter_id}`);
}

/** Once the letter is signed and no retainer is outstanding, the matter moves to In progress automatically. */
function maybeStartWork(matterId: number, actorName: string) {
  const m = getMatterSummary(matterId);
  if (!m || m.status !== "engagement_pending" || !m.engagement_signed_at) return;
  const retainerDue = listInvoices(matterId).some((i) => i.kind === "retainer" && i.status === "due");
  if (!retainerDue) setMatterStatus(matterId, "in_progress", actorName);
}

export async function approveDraft(formData: FormData) {
  const docId = Number(formData.get("document_id"));
  const doc = getDocument(docId);
  if (!doc) return;
  const { user } = await ownMatter(doc.matter_id);
  approveDocument(docId, user);
  revalidatePath(`/portal/matters/${doc.matter_id}`);
}

export async function bookMeeting(formData: FormData) {
  const matterId = Number(formData.get("matter_id"));
  const slot = String(formData.get("slot") ?? "");
  const purpose = String(formData.get("purpose") ?? "Video meeting").trim().slice(0, 120) || "Video meeting";
  const { user, matter } = await ownMatter(matterId);
  const open = availableSlots(takenSlots(matter.lawyer_id), 8, 30).flatMap((d) => d.slots.map((s) => s.iso));
  if (!open.includes(slot)) redirect(`/portal/matters/${matterId}?book_error=1#meetings`);
  bookAppointment({ matter_id: matterId, lawyer_id: matter.lawyer_id, starts_at: slot, duration_minutes: 30, purpose, actor: user });
  if (matter.status === "intake_received") setMatterStatus(matterId, "consultation_scheduled", "System");
  revalidatePath(`/portal/matters/${matterId}`);
}

export async function saveProfile(formData: FormData) {
  const user = await requireUser("client");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;
  updateUserProfile(user.id, {
    name,
    phone: String(formData.get("phone") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
  });
  revalidatePath("/portal/account");
  redirect("/portal/account?saved=1");
}
