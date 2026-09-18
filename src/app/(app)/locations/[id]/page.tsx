import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocation, listServiceRequests } from "@/lib/data";
import { LOCATION_STATUSES } from "@/lib/types";
import Badge from "@/components/Badge";
import { updateLocationAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = getLocation(Number(id));
  if (!location) notFound();

  const requests = listServiceRequests({ locationId: location.id });
  const updateWithId = updateLocationAction.bind(null, location.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Store #{location.store_number}</p>
          <h1 className="text-2xl font-semibold text-charcoal">{location.name}</h1>
        </div>
        <Link
          href={`/service-requests/new?locationId=${location.id}`}
          className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          New Service Request
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form
          action={updateWithId}
          className="bg-white border border-stone-200 rounded-lg p-5 space-y-4"
        >
          <h2 className="font-medium text-charcoal">Location Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Name</label>
              <input
                name="name"
                defaultValue={location.name}
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Ownership</label>
              <input
                name="ownership"
                defaultValue={location.ownership ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
              <select
                name="status"
                defaultValue={location.status}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                {LOCATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Address</label>
              <input
                name="address"
                defaultValue={location.address ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">City</label>
              <input
                name="city"
                defaultValue={location.city ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Province</label>
              <input
                name="province"
                defaultValue={location.province ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Postal Code</label>
              <input
                name="postal_code"
                defaultValue={location.postal_code ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Phone</label>
              <input
                name="phone"
                defaultValue={location.phone ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Site Contact
              </label>
              <input
                name="contact_name"
                defaultValue={location.contact_name ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
              <textarea
                name="notes"
                defaultValue={location.notes ?? ""}
                rows={3}
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
            <h2 className="font-medium text-charcoal">Service History</h2>
          </div>
          {requests.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500">No service requests for this location yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {requests.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <Link
                    href={`/service-requests/${r.id}`}
                    className="text-sm font-medium text-charcoal hover:underline"
                  >
                    {r.issue_description}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <Badge label={r.status} />
                    <Badge label={r.priority} />
                    <span className="text-xs text-stone-500">
                      {new Date(r.reported_at).toLocaleDateString()}
                    </span>
                    {r.service_company_name && (
                      <span className="text-xs text-stone-500">· {r.service_company_name}</span>
                    )}
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
