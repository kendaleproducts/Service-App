"use client";

import SpreadsheetImportForm from "@/components/SpreadsheetImportForm";
import { runServiceCompanyImport } from "./actions";

export default function ImportForm() {
  return (
    <SpreadsheetImportForm
      action={runServiceCompanyImport}
      helpText="Expected columns (names are flexible): Company Name, Contact Name, Phone, Email, Coverage Area, Notes. Existing companies are matched and updated by name; new names are added."
    />
  );
}
