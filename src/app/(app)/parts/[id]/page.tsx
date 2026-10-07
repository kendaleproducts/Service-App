import Link from "next/link";
import { notFound } from "next/navigation";
import { getPart, listShipmentsForPart } from "@/lib/data";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
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

  return (
    <div className="space-y-6">
      <div>
        <BackLink fallbackHref="/parts" label="Back to parts" />
        <h1 className="text-2xl font-semibold text-charcoal mt-1">{part.part_number}</h1>
        <p className="text-sm text-stone-500">{part.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form action={updateWithId} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Description</label>
            <input
              name="description"
              defaultValue={part.description}
              required
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
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
