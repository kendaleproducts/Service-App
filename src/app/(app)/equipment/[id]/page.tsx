import Link from "next/link";
import { notFound } from "next/navigation";
import { getEquipmentWithLocation, listServiceRequestsForEquipment } from "@/lib/data";
import { EQUIPMENT_STATUSES } from "@/lib/types";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
import { updateEquipmentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const unit = getEquipmentWithLocation(Number(id));
  if (!unit) notFound();

  const requests = listServiceRequestsForEquipment(unit.id);
  const billable = requests.filter((r) => r.status !== "Cancelled");
  const lifetimeCost = billable.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const updateWithId = updateEquipmentAction.bind(null, unit.id);
  const thisYear = new Date().getUTCFullYear();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackLink fallbackHref={`/locations/${unit.location_id}`} label="Back to location" />
          <p className="text-sm text-stone-500 mt-1">
            <Link href={`/locations/${unit.location_id}`} className="hover:underline">
              #{unit.store_number} {unit.location_name}
            </Link>
            {unit.city ? ` · ${unit.city}` : ""}
            {unit.province ? `, ${unit.province}` : ""}
          </p>
          <h1 className="text-2xl font-semibold text-charcoal">{unit.serial_number}</h1>
          {unit.description && <p className="text-sm text-stone-500">{unit.description}</p>}
        </div>
        <Badge label={unit.status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <p className="text-sm text-stone-500">Service Calls</p>
          <p className="text-2xl font-semibold text-charcoal mt-1">{billable.length}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <p className="text-sm text-stone-500">Lifetime Service Cost</p>
          <p className="text-2xl font-semibold text-charcoal mt-1">
            ${lifetimeCost.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <p className="text-sm text-stone-500">Age</p>
          <p className="text-2xl font-semibold text-charcoal mt-1">
            {unit.installed_year ? `${thisYear - unit.installed_year} yr` : "—"}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <p className="text-sm text-stone-500">Replacement Cost</p>
          <p className="text-2xl font-semibold text-charcoal mt-1">
            {unit.replacement_cost != null
              ? `$${unit.replacement_cost.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form
          action={updateWithId}
          className="bg-white border border-stone-200 rounded-lg p-5 space-y-4"
        >
          <h2 className="font-medium text-charcoal">Equipment Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Serial Number
              </label>
              <input
                name="serial_number"
                defaultValue={unit.serial_number}
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Make / Model
              </label>
              <input
                name="description"
                defaultValue={unit.description ?? ""}
                placeholder="e.g. Broaster 1800 pressure fryer"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Installed Year
              </label>
              <input
                name="installed_year"
                type="number"
                min="1980"
                max={thisYear}
                step="1"
                defaultValue={unit.installed_year ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Replacement Cost ($)
              </label>
              <input
                name="replacement_cost"
                type="number"
                min="0"
                step="1"
                defaultValue={unit.replacement_cost ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
              <select
                name="status"
                defaultValue={unit.status}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                {EQUIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500 mt-1">
                Obsolete units are flagged for replacement on the Fleet report. Retired units are
                kept for history but left out of it.
              </p>
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
            <p className="px-4 py-6 text-sm text-stone-500">No service requests for this unit yet.</p>
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
                    {r.cost != null && (
                      <span className="text-xs text-stone-500">· ${r.cost.toFixed(2)}</span>
                    )}
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
