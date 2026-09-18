"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPartShipment, updatePartShipmentStatus } from "@/lib/data";

export async function createShipmentAction(formData: FormData) {
  const partIds = formData.getAll("part_id").map((v) => Number(v));
  const quantities = formData.getAll("quantity").map((v) => Number(v));
  const items = partIds
    .map((part_id, i) => ({ part_id, quantity: quantities[i] ?? 0 }))
    .filter((item) => item.part_id && item.quantity > 0);

  if (items.length === 0) {
    throw new Error("Add at least one part with a quantity");
  }

  const locationIdRaw = formData.get("location_id");
  const companyIdRaw = formData.get("service_company_id");
  const serviceRequestIdRaw = formData.get("service_request_id");

  const id = createPartShipment(
    {
      service_request_id: serviceRequestIdRaw ? Number(serviceRequestIdRaw) : null,
      location_id: locationIdRaw ? Number(locationIdRaw) : null,
      service_company_id: companyIdRaw ? Number(companyIdRaw) : null,
      carrier: String(formData.get("carrier") ?? "") || null,
      tracking_number: String(formData.get("tracking_number") ?? "") || null,
      status: String(formData.get("status") ?? "Preparing"),
      notes: String(formData.get("notes") ?? "") || null,
    },
    items
  );
  revalidatePath("/shipments");
  revalidatePath("/parts");
  redirect(`/shipments/${id}`);
}

export async function updateShipmentStatusAction(id: number, formData: FormData) {
  const status = String(formData.get("status") ?? "Preparing");
  const extra: Record<string, string | null> = {
    tracking_number: String(formData.get("tracking_number") ?? "") || null,
    carrier: String(formData.get("carrier") ?? "") || null,
  };
  if (status === "Shipped") {
    extra.shipped_at = new Date().toISOString();
  }
  if (status === "Delivered") {
    extra.delivered_at = new Date().toISOString();
  }
  updatePartShipmentStatus(id, status, extra);
  revalidatePath(`/shipments/${id}`);
  revalidatePath("/shipments");
}
