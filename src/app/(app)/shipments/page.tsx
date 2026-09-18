import Link from "next/link";
import { listPartShipments } from "@/lib/data";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const shipments = listPartShipments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Parts Shipments</h1>
          <p className="text-sm text-stone-500 mt-1">{shipments.length} shipment(s)</p>
        </div>
        <Link
          href="/shipments/new"
          className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Ship Parts
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Shipment</th>
              <th className="px-4 py-2 font-medium">Destination</th>
              <th className="px-4 py-2 font-medium">Carrier / Tracking</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <Link href={`/shipments/${s.id}`} className="text-charcoal hover:underline">
                    #{s.id}
                  </Link>
                </td>
                <td className="px-4 py-2 text-stone-600">
                  {s.location_name ?? s.service_company_name ?? "—"}
                </td>
                <td className="px-4 py-2 text-stone-600">
                  {s.carrier ?? "—"} {s.tracking_number ? `· ${s.tracking_number}` : ""}
                </td>
                <td className="px-4 py-2">
                  <Badge label={s.status} />
                </td>
                <td className="px-4 py-2 text-stone-600">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {shipments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No shipments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
