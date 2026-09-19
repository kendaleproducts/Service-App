import Link from "next/link";
import ImportForm from "./ImportForm";

export default function ServiceCompaniesImportPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/service-companies" className="text-sm text-stone-500 hover:text-hotsauce">
          ← Back to service companies
        </Link>
        <h1 className="text-2xl font-semibold text-charcoal mt-1">Import Service Companies</h1>
        <p className="text-sm text-stone-500 mt-1">
          Upload your list of contracted service providers to add or update them.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
