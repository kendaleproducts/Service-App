import Link from "next/link";
import { listParts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lowStock?: string }>;
}) {
  const params = await searchParams;
  const allParts = listParts(params.q);
  const parts = params.lowStock
    ? allParts.filter((p) => p.quantity_on_hand <= p.reorder_threshold)
    : allParts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Parts Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {parts.length} part(s) {params.lowStock && "— low stock only"} · stocked in Fort Erie, ON
          </p>
        </div>
        <Link
          href="/parts/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Part
        </Link>
      </div>

      <form className="flex gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search part number or description..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Search
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2 font-medium">Part #</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">On Hand</th>
              <th className="px-4 py-2 font-medium">Reorder At</th>
              <th className="px-4 py-2 font-medium">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => {
              const low = p.quantity_on_hand <= p.reorder_threshold;
              return (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/parts/${p.id}`} className="text-slate-900 hover:underline">
                      {p.part_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{p.description}</td>
                  <td className={`px-4 py-2 font-medium ${low ? "text-red-600" : "text-slate-700"}`}>
                    {p.quantity_on_hand}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.reorder_threshold}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {p.unit_cost != null ? `$${p.unit_cost.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
            {parts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No parts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
