import {
  getServiceRequest,
  listLocations,
  listParts,
  listServiceCompanies,
} from "@/lib/data";
import { SHIPMENT_STATUSES } from "@/lib/types";
import ShipmentItemsField from "../ShipmentItemsField";
import { createShipmentAction } from "../actions";

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceRequestId?: string }>;
}) {
  const params = await searchParams;
  const serviceRequestId = params.serviceRequestId ? Number(params.serviceRequestId) : undefined;
  const serviceRequest = serviceRequestId ? getServiceRequest(serviceRequestId) : undefined;

  const locations = listLocations({ status: "Open" });
  const companies = listServiceCompanies();
  const parts = listParts();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-charcoal">Ship Parts</h1>
      <form action={createShipmentAction} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
        {serviceRequestId && (
          <input type="hidden" name="service_request_id" value={serviceRequestId} />
        )}
        {serviceRequest && (
          <p className="text-sm text-stone-500">
            Linked to service request #{serviceRequest.id} — {serviceRequest.location_name}
          </p>
        )}

        <ShipmentItemsField parts={parts} />

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Ship to Location
            </label>
            <select
              name="location_id"
              defaultValue={serviceRequest?.location_id ?? ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.store_number} — {l.name} ({l.city}, {l.province})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Or Ship to Service Company
            </label>
            <select
              name="service_company_id"
              defaultValue=""
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Carrier</label>
            <input
              name="carrier"
              placeholder="e.g. Canada Post, Purolator"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Tracking Number
            </label>
            <input
              name="tracking_number"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue="Preparing"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Create Shipment
        </button>
      </form>
    </div>
  );
}
