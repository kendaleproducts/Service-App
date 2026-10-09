"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addServiceRequestNote,
  createServiceRequest,
  deleteServiceRequest,
  getEquipment,
  getOrCreateEquipment,
  listEquipmentForLocation,
  setPartsForRequest,
  updateServiceRequest,
} from "@/lib/data";
import { requireAdmin } from "@/lib/session";

export async function getLocationEquipmentAction(locationId: number) {
  return listEquipmentForLocation(locationId);
}

function parsePartsFromFormData(formData: FormData): { part_id: number; quantity: number }[] {
  const partIds = formData.getAll("part_id");
  const quantities = formData.getAll("quantity");
  const items: { part_id: number; quantity: number }[] = [];
  for (let i = 0; i < partIds.length; i++) {
    const part_id = Number(partIds[i]);
    const quantity = Number(quantities[i]);
    if (part_id && quantity > 0) items.push({ part_id, quantity });
  }
  return items;
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
  const installedYearRaw = String(formData.get("installed_year") ?? "").trim();

  const missing: string[] = [];
  if (!location_id) missing.push("Location");
  if (!issue_description) missing.push("Issue description");
  if (!companyIdRaw) missing.push("Assign service company");
  if (!reported_by) missing.push("Reported by");
  if (!scheduled_at) missing.push("Scheduled date");
  if (!existingEquipmentIdRaw && !newSerialNumber) missing.push("Equipment / serial number");
  if (!existingEquipmentIdRaw && !installedYearRaw) missing.push("Installed year");
  if (missing.length > 0) {
    throw new Error(`All fields are required. Missing: ${missing.join(", ")}`);
  }

  const equipment_id = existingEquipmentIdRaw
    ? Number(existingEquipmentIdRaw)
    : getOrCreateEquipment({
        location_id,
        serial_number: newSerialNumber,
        description: equipment_description || null,
        installed_year: Number(installedYearRaw),
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
  setPartsForRequest(id, parsePartsFromFormData(formData));
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
  setPartsForRequest(id, parsePartsFromFormData(formData));
  revalidatePath(`/service-requests/${id}`);
  revalidatePath("/service-requests");
}

export async function addNoteAction(id: number, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  addServiceRequestNote(id, note);
  revalidatePath(`/service-requests/${id}`);
}

export async function deleteServiceRequestAction(id: number) {
  await requireAdmin();
  deleteServiceRequest(id);
  revalidatePath("/service-requests");
  redirect("/service-requests");
}
