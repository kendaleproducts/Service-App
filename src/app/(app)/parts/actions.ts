"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPart, updatePart } from "@/lib/data";

export async function createPartAction(formData: FormData) {
  const part_number = String(formData.get("part_number") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!part_number || !description) throw new Error("Part number and description are required");

  const id = createPart({ part_number, description });
  revalidatePath("/parts");
  redirect(`/parts/${id}`);
}

export async function updatePartAction(id: number, formData: FormData) {
  updatePart(id, {
    description: String(formData.get("description") ?? "").trim(),
  });
  revalidatePath(`/parts/${id}`);
  revalidatePath("/parts");
}
