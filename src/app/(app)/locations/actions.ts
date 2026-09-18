"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLocation, getOrCreateCustomer, updateLocation } from "@/lib/data";

export async function updateLocationAction(id: number, formData: FormData) {
  updateLocation(id, {
    name: String(formData.get("name") ?? ""),
    ownership: String(formData.get("ownership") ?? "") || null,
    status: String(formData.get("status") ?? "Open"),
    address: String(formData.get("address") ?? "") || null,
    city: String(formData.get("city") ?? "") || null,
    province: String(formData.get("province") ?? "") || null,
    postal_code: String(formData.get("postal_code") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    contact_name: String(formData.get("contact_name") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  revalidatePath(`/locations/${id}`);
  revalidatePath("/locations");
}

export async function createLocationAction(formData: FormData) {
  const customer = getOrCreateCustomer("Mary Brown's");
  const storeNumber = String(formData.get("store_number") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!storeNumber || !name) {
    throw new Error("Store number and name are required");
  }
  const id = createLocation({
    customer_id: customer.id,
    store_number: storeNumber,
    name,
    ownership: String(formData.get("ownership") ?? "") || null,
    status: String(formData.get("status") ?? "Open"),
    address: String(formData.get("address") ?? "") || null,
    city: String(formData.get("city") ?? "") || null,
    province: String(formData.get("province") ?? "") || null,
    postal_code: String(formData.get("postal_code") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    contact_name: String(formData.get("contact_name") ?? "") || null,
  });
  revalidatePath("/locations");
  redirect(`/locations/${id}`);
}
