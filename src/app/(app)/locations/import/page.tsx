import BackLink from "@/components/BackLink";
import ImportForm from "./ImportForm";

export default function LocationsImportPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BackLink fallbackHref="/locations" label="Back to locations" />
        <h1 className="text-2xl font-semibold text-charcoal mt-1">Import Locations</h1>
        <p className="text-sm text-stone-500 mt-1">
          Upload the head office spreadsheet to add new stores or refresh existing ones.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
