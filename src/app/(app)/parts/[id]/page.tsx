import Link from "next/link";
import { notFound } from "next/navigation";
import { getPart, listShipmentsForPart } from "@/lib/data";
import Badge from "@/components/Badge";
import { updatePartAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const part = getPart(Number(id));
  if (!part) notFound();

  const shipments = listShipmentsForPart(part.id);
  const updateWithId = updatePartAction.bind(null, part.id);
  const low = part.quantity_on_hand <= part.reorder_threshold;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parts" className="text-sm text-stone-500 hover:text-hotsauce">
          ← Back to parts
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-semibold text-charcoal">{part.part_number}</h1>
          {low && <Badge label="Low Stock" />}
        </div>
        <p className="text-sm text-stone-500">{part.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form action={updateWithId} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Description</label>
              <input
                name="description"
                defaultValue={part.description}
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Quantity On Hand
              </label>
              <input
                name="quantity_on_hand"
                type="number"
                defaultValue={part.quantity_on_hand}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Reorder Threshold
              </label>
              <input
                name="reorder_threshold"
                type="number"
                defaultValue={part.reorder_threshold}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Unit Cost ($)
              </label>
              <input
                name="unit_cost"
                type="number"
                step="0.01"
                defaultValue={part.unit_cost ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={part.notes ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
          >
            Save Changes
          </button>
        </form>

        <div className="bg-white border border-stone-200 rounded-lg">
          <div className="px-4 py-3 border-b border-stone-200">
            <h2 className="font-medium text-charcoal">Shipment History</h2>
          </div>
          {shipments.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500">This part hasn&apos;t been shipped yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {shipments.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <Link
                    href={`/shipments/${s.id}`}
                    className="text-sm font-medium text-charcoal hover:underline"
                  >
                    Qty {s.quantity} → {s.location_name ?? s.service_company_name ?? "Unknown destination"}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge label={s.status} />
                    <span className="text-xs text-stone-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
