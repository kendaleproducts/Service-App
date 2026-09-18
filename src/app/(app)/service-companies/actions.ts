"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceCompany, updateServiceCompany } from "@/lib/data";

function fields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    coverage_area: String(formData.get("coverage_area") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  };
}

export async function createServiceCompanyAction(formData: FormData) {
  const data = fields(formData);
  if (!data.name) throw new Error("Name is required");
  const id = createServiceCompany(data);
  revalidatePath("/service-companies");
  redirect(`/service-companies/${id}`);
}

export async function updateServiceCompanyAction(id: number, formData: FormData) {
  updateServiceCompany(id, fields(formData));
  revalidatePath(`/service-companies/${id}`);
  revalidatePath("/service-companies");
}
