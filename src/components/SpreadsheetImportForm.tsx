"use client";

import { useActionState } from "react";

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export default function SpreadsheetImportForm({
  action,
  helpText,
}: {
  action: (prevState: ImportResult | null, formData: FormData) => Promise<ImportResult>;
  helpText: string;
}) {
  const [result, formAction, isPending] = useActionState(action, null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Spreadsheet file (.xlsx, .xls, .csv)
          </label>
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            required
            className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-hotsauce file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-hickory"
          />
          <p className="text-xs text-stone-500 mt-2">{helpText}</p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory disabled:opacity-50"
        >
          {isPending ? "Importing..." : "Import"}
        </button>
      </form>

      {result && (
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <h2 className="font-medium text-charcoal mb-3">Import Result</h2>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-stone-500">Inserted</p>
              <p className="text-xl font-semibold text-green-700">{result.inserted}</p>
            </div>
            <div>
              <p className="text-stone-500">Updated</p>
              <p className="text-xl font-semibold text-charcoal">{result.updated}</p>
            </div>
            <div>
              <p className="text-stone-500">Skipped</p>
              <p className="text-xl font-semibold text-stone-600">{result.skipped}</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-hickory">Errors</p>
              <ul className="text-xs text-hickory list-disc list-inside mt-1 space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
