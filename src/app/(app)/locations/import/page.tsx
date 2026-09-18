import Link from "next/link";
import ImportForm from "./ImportForm";

export default function LocationsImportPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/locations" className="text-sm text-stone-500 hover:text-hotsauce">
          ← Back to locations
        </Link>
        <h1 className="text-2xl font-semibold text-charcoal mt-1">Import Locations</h1>
        <p className="text-sm text-stone-500 mt-1">
          Upload the head office spreadsheet to add new stores or refresh existing ones.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
