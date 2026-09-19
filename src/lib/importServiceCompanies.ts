import * as XLSX from "xlsx";
import { upsertServiceCompanyByName } from "./data";

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

export function importServiceCompaniesFromWorkbook(buffer: Buffer): ImportResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  rows.forEach((row, index) => {
    const nameKey = findKey(row, [
      "company name",
      "company",
      "vendor",
      "vendor name",
      "service company",
      "name",
    ]);
    const contactKey = findKey(row, [
      "contact name",
      "contact",
      "primary contact",
      "contact person",
    ]);
    const phoneKey = findKey(row, ["phone", "phone number", "telephone", "tel"]);
    const emailKey = findKey(row, ["email", "email address"]);
    const coverageKey = findKey(row, [
      "coverage area",
      "coverage",
      "region",
      "service area",
      "province",
      "territory",
    ]);
    const notesKey = findKey(row, ["notes", "note", "comments"]);

    const name = nameKey ? String(row[nameKey] ?? "").trim() : "";

    if (!name) {
      result.skipped += 1;
      return;
    }

    try {
      const outcome = upsertServiceCompanyByName({
        name,
        contact_name: contactKey ? str(row[contactKey]) : null,
        phone: phoneKey ? str(row[phoneKey]) : null,
        email: emailKey ? str(row[emailKey]) : null,
        coverage_area: coverageKey ? str(row[coverageKey]) : null,
        notes: notesKey ? str(row[notesKey]) : null,
      });
      if (outcome === "inserted") result.inserted += 1;
      else result.updated += 1;
    } catch (err) {
      result.errors.push(
        `Row ${index + 2} (${name}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  return result;
}
