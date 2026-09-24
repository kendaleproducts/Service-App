import * as XLSX from "xlsx";
import { deleteAllServiceCompanies, upsertServiceCompanyByNameAndPostalCode } from "./data";

const PROVINCE_MAP: Record<string, string> = {
  bc: "BC",
  "british columbia": "BC",
  ab: "AB",
  alberta: "AB",
  sk: "SK",
  saskatchewan: "SK",
  mb: "MB",
  manitoba: "MB",
  on: "ON",
  ontario: "ON",
  qc: "QC",
  quebec: "QC",
  québec: "QC",
  nb: "NB",
  "new brunswick": "NB",
  ns: "NS",
  "nova scotia": "NS",
  pe: "PE",
  pei: "PE",
  "prince edward island": "PE",
  nl: "NL",
  newfoundland: "NL",
  "newfoundland and labrador": "NL",
  yt: "YT",
  yukon: "YT",
  nt: "NT",
  "northwest territories": "NT",
  nu: "NU",
  nunavut: "NU",
};

function normalizeProvince(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  return PROVINCE_MAP[s.toLowerCase()] ?? s;
}

function str(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

function parseLatLong(raw: unknown): { latitude: number | null; longitude: number | null } {
  const s = String(raw ?? "").trim();
  const match = s.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return { latitude: null, longitude: null };
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
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

export function importServiceCompaniesFromWorkbook(
  buffer: Buffer,
  mode: "merge" | "replace" = "merge"
): ImportResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  if (mode === "replace") {
    if (rows.length === 0) {
      result.errors.push(
        "Replace mode refused: the file has no rows. Nothing was deleted."
      );
      return result;
    }
    deleteAllServiceCompanies();
  }

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
    const coverageKey = findKey(row, ["coverage area", "coverage", "service area"]);
    const locationKey = findKey(row, ["location", "lat/long", "coordinates"]);
    const streetKey = findKey(row, ["street", "street address", "address"]);
    const cityKey = findKey(row, ["city"]);
    const provinceKey = findKey(row, ["state/region", "province", "state", "region"]);
    const countryKey = findKey(row, ["country"]);
    const postalKey = findKey(row, ["postal code", "postal/zip code", "zip code", "zip"]);
    const notesKey = findKey(row, ["notes", "note", "comments"]);

    const name = nameKey ? String(row[nameKey] ?? "").trim() : "";

    if (!name) {
      result.skipped += 1;
      return;
    }

    const { latitude, longitude } = locationKey
      ? parseLatLong(row[locationKey])
      : { latitude: null, longitude: null };

    try {
      const outcome = upsertServiceCompanyByNameAndPostalCode({
        name,
        contact_name: contactKey ? str(row[contactKey]) : null,
        phone: phoneKey ? str(row[phoneKey]) : null,
        email: emailKey ? str(row[emailKey]) : null,
        coverage_area: coverageKey ? str(row[coverageKey]) : null,
        address: streetKey ? str(row[streetKey]) : null,
        city: cityKey ? str(row[cityKey]) : null,
        province: provinceKey ? normalizeProvince(row[provinceKey]) : null,
        postal_code: postalKey ? str(row[postalKey]) : null,
        country: (countryKey ? str(row[countryKey]) : null) ?? "Canada",
        latitude,
        longitude,
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
