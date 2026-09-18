import * as XLSX from "xlsx";
import { upsertLocationByStoreNumber } from "./data";

const STATUS_MAP: Record<string, string> = {
  open: "Open",
  pending: "Pending",
  archived: "Archived",
  archvied: "Archived", // common typo seen in head-office spreadsheets
};

function normalizeStatus(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();
  return STATUS_MAP[s] ?? "Open";
}

function normalizeOwnership(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

function str(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

function findKey(row: Record<string, unknown>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const match = keys.find(
      (k) => k.trim().toLowerCase().replace(/\s+/g, " ") === candidate
    );
    if (match) return match;
  }
  return undefined;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function importLocationsFromWorkbook(
  buffer: Buffer,
  customerId: number
): ImportResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  rows.forEach((row, index) => {
    const storeNumberKey = findKey(row, ["store no.", "store no", "store number", "store #"]);
    const nameKey = findKey(row, ["store name", "name"]);
    const ownershipKey = findKey(row, ["franchise/ corporate", "franchise/corporate", "ownership"]);
    const statusKey = findKey(row, ["store status", "status"]);
    const addressKey = findKey(row, ["store address", "address"]);
    const cityKey = findKey(row, ["store city", "city"]);
    const provinceKey = findKey(row, ["store province", "province"]);
    const postalKey = findKey(row, ["store postal code", "postal code"]);

    const storeNumber = storeNumberKey ? String(row[storeNumberKey] ?? "").trim() : "";
    const name = nameKey ? String(row[nameKey] ?? "").trim() : "";

    if (!storeNumber || !name) {
      result.skipped += 1;
      return;
    }

    try {
      const outcome = upsertLocationByStoreNumber({
        customer_id: customerId,
        store_number: storeNumber,
        name,
        ownership: ownershipKey ? normalizeOwnership(row[ownershipKey]) : null,
        status: statusKey ? normalizeStatus(row[statusKey]) : "Open",
        address: addressKey ? str(row[addressKey]) : null,
        city: cityKey ? str(row[cityKey]) : null,
        province: provinceKey ? str(row[provinceKey]) : null,
        postal_code: postalKey ? str(row[postalKey]) : null,
      });
      if (outcome === "inserted") result.inserted += 1;
      else result.updated += 1;
    } catch (err) {
      result.errors.push(
        `Row ${index + 2} (store ${storeNumber}): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  });

  return result;
}
