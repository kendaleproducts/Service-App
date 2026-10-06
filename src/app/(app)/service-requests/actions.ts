"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addServiceRequestNote,
  createServiceRequest,
  getEquipment,
  getOrCreateEquipment,
  listEquipmentForLocation,
  updateServiceRequest,
} from "@/lib/data";

export async function getLocationEquipmentAction(locationId: number) {
  return listEquipmentForLocation(locationId);
}

export async function createServiceRequestAction(formData: FormData) {
  const location_id = Number(formData.get("location_id"));
  const issue_description = String(formData.get("issue_description") ?? "").trim();
  const companyIdRaw = String(formData.get("service_company_id") ?? "").trim();
  const reported_by = String(formData.get("reported_by") ?? "").trim();
  const scheduled_at = String(formData.get("scheduled_at") ?? "").trim();
  const existingEquipmentIdRaw = String(formData.get("equipment_id") ?? "").trim();
  const newSerialNumber = String(formData.get("new_serial_number") ?? "").trim();
  const equipment_description = String(formData.get("equipment_description") ?? "").trim();

  const missing: string[] = [];
  if (!location_id) missing.push("Location");
  if (!issue_description) missing.push("Issue description");
  if (!companyIdRaw) missing.push("Assign service company");
  if (!reported_by) missing.push("Reported by");
  if (!scheduled_at) missing.push("Scheduled date");
  if (!existingEquipmentIdRaw && !newSerialNumber) missing.push("Equipment / serial number");
  if (missing.length > 0) {
    throw new Error(`All fields are required. Missing: ${missing.join(", ")}`);
  }

  const equipment_id = existingEquipmentIdRaw
    ? Number(existingEquipmentIdRaw)
    : getOrCreateEquipment({
        location_id,
        serial_number: newSerialNumber,
        description: equipment_description || null,
      });
  const resolvedEquipment = getEquipment(equipment_id);

  const id = createServiceRequest({
    location_id,
    service_company_id: Number(companyIdRaw),
    equipment_id,
    priority: String(formData.get("priority") ?? "Normal"),
    equipment_description: resolvedEquipment?.description ?? null,
    issue_description,
    reported_by,
    scheduled_at,
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
