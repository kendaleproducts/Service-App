"use client";

import SpreadsheetImportForm from "@/components/SpreadsheetImportForm";
import { runServiceCompanyImport } from "./actions";

export default function ImportForm() {
  return (
    <SpreadsheetImportForm
      action={runServiceCompanyImport}
      helpText='Accepts either format: Name, Location ("lat, long"), Street, City, State/Region, Country, Postal Code — or Company Name, Contact Name, Phone, Email, Coverage Area, Notes. Column names are matched flexibly. Matched and updated by name + postal code, so the same company can have multiple regional branches.'
      replaceOption={{
        label: "Replace all existing service companies with this file",
        warning:
          "Deletes every current service company first, then imports this file fresh. Service requests and shipments already linked to a deleted company will show as Unassigned rather than losing their history. This cannot be undone.",
      }}
    />
  );
}
