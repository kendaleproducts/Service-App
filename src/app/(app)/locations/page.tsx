import Link from "next/link";
import { listLocations, listProvinces } from "@/lib/data";
import Badge from "@/components/Badge";
import { LOCATION_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; province?: string }>;
}) {
  const params = await searchParams;
  const locations = listLocations({
    q: params.q,
    status: params.status,
    province: params.province,
  });
  const provinces = listProvinces();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Locations</h1>
          <p className="text-sm text-stone-500 mt-1">{locations.length} location(s)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/locations/import"
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Import from Excel
          </Link>
          <Link
            href="/locations/new"
            className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
          >
            Add Location
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 bg-white border border-stone-200 rounded-lg p-4">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search store #, name, city, address..."
          className="flex-1 min-w-[200px] rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {LOCATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="province"
          defaultValue={params.province ?? ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Store #</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Ownership</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">Province</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <Link href={`/locations/${loc.id}`} className="text-charcoal hover:underline">
                    {loc.store_number}
                  </Link>
                </td>
                <td className="px-4 py-2 text-stone-700">{loc.name}</td>
                <td className="px-4 py-2 text-stone-600">{loc.ownership ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{loc.city ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">{loc.province ?? "—"}</td>
                <td className="px-4 py-2">
                  <Badge label={loc.status} />
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No locations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
