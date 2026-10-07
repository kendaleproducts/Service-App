"use server";

import { revalidatePath } from "next/cache";
import { geocodeAllMissingServiceCompanies, type GeocodeBatchResult } from "@/lib/geocode";

export async function geocodeServiceCompaniesAction(): Promise<GeocodeBatchResult> {
  const result = await geocodeAllMissingServiceCompanies();
  if (result.geocoded > 0) {
    revalidatePath("/service-companies");
    revalidatePath("/locations");
  }
  return result;
}
