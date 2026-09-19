import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartShipment, listShipmentItems } from "@/lib/data";
import { SHIPMENT_STATUSES } from "@/lib/types";
import Badge from "@/components/Badge";
import { updateShipmentStatusAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shipment = getPartShipment(Number(id));
  if (!shipment) notFound();

  const items = listShipmentItems(shipment.id);
  const updateWithId = updateShipmentStatusAction.bind(null, shipment.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/shipments" className="text-sm text-stone-500 hover:text-hotsauce">
            ← Back to shipments
          </Link>
          <h1 className="text-2xl font-semibold text-charcoal mt-1">Shipment #{shipment.id}</h1>
          <p className="text-sm text-stone-500">
            To {shipment.location_name ?? shipment.service_company_name ?? "Unknown destination"}
          </p>
        </div>
        <Badge label={shipment.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-lg">
          <div className="px-4 py-3 border-b border-stone-200">
            <h2 className="font-medium text-charcoal">Parts in this Shipment</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-100">
                  <th className="px-4 py-2 font-medium">Part #</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-2">
                      <Link href={`/parts/${item.part_id}`} className="text-charcoal hover:underline">
                        {item.part_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-stone-600">{item.description}</td>
                    <td className="px-4 py-2 text-stone-600">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shipment.notes && (
            <div className="px-4 py-3 border-t border-stone-100 text-sm text-stone-600">
              {shipment.notes}
            </div>
          )}
        </div>

        <form action={updateWithId} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <h2 className="font-medium text-charcoal">Shipping Status</h2>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue={shipment.status}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Carrier</label>
            <input
              name="carrier"
              defaultValue={shipment.carrier ?? ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Tracking Number
            </label>
            <input
              name="tracking_number"
              defaultValue={shipment.tracking_number ?? ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          {shipment.shipped_at && (
            <p className="text-xs text-stone-500">
              Shipped: {new Date(shipment.shipped_at).toLocaleString()}
            </p>
          )}
          {shipment.delivered_at && (
            <p className="text-xs text-stone-500">
              Delivered: {new Date(shipment.delivered_at).toLocaleString()}
            </p>
          )}
          <button
            type="submit"
            className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
          >
            Update Status
          </button>
        </form>
      </div>
    </div>
  );
}
