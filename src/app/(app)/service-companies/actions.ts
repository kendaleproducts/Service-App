"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createServiceCompany,
  deleteAllServiceCompanies,
  deleteServiceCompany,
  unassignCompanyFromHistory,
  updateServiceCompany,
} from "@/lib/data";
import { requireAdmin } from "@/lib/session";

function fields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    coverage_area: String(formData.get("coverage_area") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    city: String(formData.get("city") ?? "") || null,
    province: String(formData.get("province") ?? "") || null,
    postal_code: String(formData.get("postal_code") ?? "") || null,
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

export async function deleteServiceCompanyAction(id: number) {
  await requireAdmin();
  deleteServiceCompany(id);
  revalidatePath("/service-companies");
  redirect("/service-companies");
}

export async function unassignCompanyFromHistoryAction(id: number) {
  await requireAdmin();
  unassignCompanyFromHistory(id);
  revalidatePath(`/service-companies/${id}`);
  revalidatePath("/service-requests");
}

export async function clearAllServiceCompaniesAction() {
  await requireAdmin();
  deleteAllServiceCompanies();
  revalidatePath("/service-companies");
  revalidatePath("/service-requests");
}
