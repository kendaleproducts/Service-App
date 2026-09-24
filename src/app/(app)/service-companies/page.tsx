import Link from "next/link";
import { listServiceCompanies } from "@/lib/data";
import ClickableRow from "@/components/ClickableRow";

export const dynamic = "force-dynamic";

export default async function ServiceCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const allCompanies = listServiceCompanies();
  const q = params.q?.trim().toLowerCase();
  const companies = q
    ? allCompanies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q) ||
          (c.province ?? "").toLowerCase().includes(q)
      )
    : allCompanies;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Service Companies</h1>
          <p className="text-sm text-stone-500 mt-1">
            {companies.length} of {allCompanies.length} contracted vendor(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/service-companies/import"
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Import from Excel
          </Link>
          <Link
            href="/service-companies/new"
            className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
          >
            Add Company
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 bg-white border border-stone-200 rounded-lg p-4">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search name, city, province..."
          className="flex-1 min-w-[200px] rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Search
        </button>
      </form>

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">Province</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <ClickableRow
                key={c.id}
                href={`/service-companies/${c.id}`}
                className="border-b border-stone-50 last:border-0 hover:bg-stone-50"
              >
                <td className="px-4 py-2">
                  <Link href={`/service-companies/${c.id}`} className="text-charcoal hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-stone-600">{c.city ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{c.province ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{c.contact_name ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{c.phone ?? "—"}</td>
              </ClickableRow>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No service companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
