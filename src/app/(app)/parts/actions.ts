"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPart, updatePart } from "@/lib/data";

export async function createPartAction(formData: FormData) {
  const part_number = String(formData.get("part_number") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!part_number || !description) throw new Error("Part number and description are required");

  const id = createPart({
    part_number,
    description,
    quantity_on_hand: Number(formData.get("quantity_on_hand") ?? 0),
    reorder_threshold: Number(formData.get("reorder_threshold") ?? 0),
    unit_cost: formData.get("unit_cost") ? Number(formData.get("unit_cost")) : null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  revalidatePath("/parts");
  redirect(`/parts/${id}`);
}

export async function updatePartAction(id: number, formData: FormData) {
  updatePart(id, {
    description: String(formData.get("description") ?? "").trim(),
    quantity_on_hand: Number(formData.get("quantity_on_hand") ?? 0),
    reorder_threshold: Number(formData.get("reorder_threshold") ?? 0),
    unit_cost: formData.get("unit_cost") ? Number(formData.get("unit_cost")) : null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  revalidatePath(`/parts/${id}`);
  revalidatePath("/parts");
}
