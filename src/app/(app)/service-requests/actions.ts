"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addServiceRequestNote,
  createServiceRequest,
  updateServiceRequest,
} from "@/lib/data";

export async function createServiceRequestAction(formData: FormData) {
  const location_id = Number(formData.get("location_id"));
  const issue_description = String(formData.get("issue_description") ?? "").trim();
  if (!location_id || !issue_description) {
    throw new Error("Location and issue description are required");
  }
  const companyIdRaw = formData.get("service_company_id");
  const scheduledRaw = String(formData.get("scheduled_at") ?? "");

  const id = createServiceRequest({
    location_id,
    service_company_id: companyIdRaw ? Number(companyIdRaw) : null,
    priority: String(formData.get("priority") ?? "Normal"),
    equipment_description: String(formData.get("equipment_description") ?? "") || null,
    issue_description,
    reported_by: String(formData.get("reported_by") ?? "") || null,
    scheduled_at: scheduledRaw || null,
  });
  revalidatePath("/service-requests");
  redirect(`/service-requests/${id}`);
}

export async function updateServiceRequestAction(id: number, formData: FormData) {
  const companyIdRaw = formData.get("service_company_id");
  const status = String(formData.get("status") ?? "New");
  const scheduledRaw = String(formData.get("scheduled_at") ?? "");
  const completedRaw = String(formData.get("completed_at") ?? "");
  const costRaw = formData.get("cost");

  updateServiceRequest(id, {
    service_company_id: companyIdRaw ? Number(companyIdRaw) : null,
    status,
    priority: String(formData.get("priority") ?? "Normal"),
    equipment_description: String(formData.get("equipment_description") ?? "") || null,
    issue_description: String(formData.get("issue_description") ?? "").trim(),
    reported_by: String(formData.get("reported_by") ?? "") || null,
    scheduled_at: scheduledRaw || null,
    completed_at:
      status === "Completed" && !completedRaw
        ? new Date().toISOString()
        : completedRaw || null,
    cost: costRaw ? Number(costRaw) : null,
  });
  revalidatePath(`/service-requests/${id}`);
  revalidatePath("/service-requests");
}

export async function addNoteAction(id: number, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  addServiceRequestNote(id, note);
  revalidatePath(`/service-requests/${id}`);
}
