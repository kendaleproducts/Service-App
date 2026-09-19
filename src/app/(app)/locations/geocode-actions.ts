"use server";

import { revalidatePath } from "next/cache";
import { geocodeAllMissingLocations, type GeocodeBatchResult } from "@/lib/geocode";

export async function geocodeLocationsAction(): Promise<GeocodeBatchResult> {
  const result = await geocodeAllMissingLocations();
  if (result.geocoded > 0) {
    revalidatePath("/locations");
  }
  return result;
}
