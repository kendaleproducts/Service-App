"use server";

import { revalidatePath } from "next/cache";
import {
  importServiceCompaniesFromWorkbook,
  type ImportResult,
} from "@/lib/importServiceCompanies";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function runServiceCompanyImport(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { inserted: 0, updated: 0, skipped: 0, errors: ["Please choose a spreadsheet file."] };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { inserted: 0, updated: 0, skipped: 0, errors: ["File is too large (max 10MB)."] };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = importServiceCompaniesFromWorkbook(buffer);
    revalidatePath("/service-companies");
    return result;
  } catch (err) {
    return {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [
        `Could not read the spreadsheet: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }
}
