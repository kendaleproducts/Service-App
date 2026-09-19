"use client";

import SpreadsheetImportForm from "@/components/SpreadsheetImportForm";
import { runLocationImport } from "./actions";

export default function ImportForm() {
  return (
    <SpreadsheetImportForm
      action={runLocationImport}
      helpText="Expected columns: Store No., Store Name, Franchise/Corporate, Store Status, Store Address, Store City, Store Province, Store Postal Code. Existing locations are matched and updated by store number; new store numbers are added."
    />
  );
}
