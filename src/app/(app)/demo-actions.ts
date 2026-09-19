"use server";

import { revalidatePath } from "next/cache";
import { seedFryerDemo, type DemoSeedResult } from "@/lib/demoSeed";

export async function loadDemoDataAction(): Promise<DemoSeedResult> {
  const result = seedFryerDemo();
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/service-requests");
    revalidatePath("/service-companies");
    revalidatePath("/parts");
  }
  return result;
}
