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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Parts Inventory</h1>
          <p className="text-sm text-stone-500 mt-1">
            {parts.length} part(s) {params.lowStock && "— low stock only"} · stocked in Fort Erie, ON
          </p>
        </div>
        <Link
          href="/parts/new"
          className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Add Part
        </Link>
      </div>

      <form className="flex gap-3 bg-white border border-stone-200 rounded-lg p-4">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search part number or description..."
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
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
                <tr key={p.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-2">
                    <Link href={`/parts/${p.id}`} className="text-charcoal hover:underline">
                      {p.part_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-stone-700">{p.description}</td>
                  <td className={`px-4 py-2 font-medium ${low ? "text-hickory" : "text-stone-700"}`}>
                    {p.quantity_on_hand}
                  </td>
                  <td className="px-4 py-2 text-stone-600">{p.reorder_threshold}</td>
                  <td className="px-4 py-2 text-stone-600">
                    {p.unit_cost != null ? `$${p.unit_cost.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
            {parts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
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
