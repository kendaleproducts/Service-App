import { listLocations, listServiceCompanies } from "@/lib/data";
import { SERVICE_REQUEST_PRIORITIES } from "@/lib/types";
import { createServiceRequestAction } from "../actions";

export default async function NewServiceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const params = await searchParams;
  const locations = listLocations({ status: "Open" });
  const companies = listServiceCompanies();
  const preselected = params.locationId ? Number(params.locationId) : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">New Service Request</h1>
      <form
        action={createServiceRequestAction}
        className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
          <select
            name="location_id"
            required
            defaultValue={preselected ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a location...
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                #{l.store_number} — {l.name} ({l.city}, {l.province})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Equipment (make/model, optional)
          </label>
          <input
            name="equipment_description"
            placeholder="e.g. Frymaster FPH155 fryer"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Issue Description
          </label>
          <textarea
            name="issue_description"
            required
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
            <select
              name="priority"
              defaultValue="Normal"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {SERVICE_REQUEST_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Assign Service Company
            </label>
            <select
              name="service_company_id"
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Reported By</label>
            <input
              name="reported_by"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Scheduled Date (optional)
            </label>
            <input
              name="scheduled_at"
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create Service Request
        </button>
      </form>
    </div>
  );
}
