import Link from "next/link";
import { listServiceCompanies } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ServiceCompaniesPage() {
  const companies = listServiceCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Service Companies</h1>
          <p className="text-sm text-stone-500 mt-1">{companies.length} contracted vendor(s)</p>
        </div>
        <Link
          href="/service-companies/new"
          className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Add Company
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Coverage Area</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <Link href={`/service-companies/${c.id}`} className="text-charcoal hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-stone-600">{c.contact_name ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{c.phone ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{c.email ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{c.coverage_area ?? "—"}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No service companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
