"use server";

import { revalidatePath } from "next/cache";
import { getEquipment, updateEquipment } from "@/lib/data";
import { EQUIPMENT_STATUSES } from "@/lib/types";

export async function updateEquipmentAction(id: number, formData: FormData) {
  const existing = getEquipment(id);
  if (!existing) throw new Error("Equipment not found");

  const serial_number = String(formData.get("serial_number") ?? "").trim();
  if (!serial_number) throw new Error("Serial number is required");

  const yearRaw = String(formData.get("installed_year") ?? "").trim();
  const costRaw = String(formData.get("replacement_cost") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "Active");
  const status = (EQUIPMENT_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : "Active";

  updateEquipment(id, {
    serial_number,
    description: String(formData.get("description") ?? "").trim() || null,
    installed_year: yearRaw ? Number(yearRaw) : null,
    replacement_cost: costRaw ? Number(costRaw) : null,
    status,
  });

  revalidatePath(`/equipment/${id}`);
  revalidatePath(`/locations/${existing.location_id}`);
  revalidatePath("/reports/fleet");
}
