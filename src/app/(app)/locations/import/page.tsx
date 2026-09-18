import Link from "next/link";
import ImportForm from "./ImportForm";

export default function LocationsImportPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/locations" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to locations
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">Import Locations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload the head office spreadsheet to add new stores or refresh existing ones.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
