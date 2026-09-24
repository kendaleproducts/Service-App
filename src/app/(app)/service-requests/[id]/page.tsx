import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getServiceRequest,
  listServiceCompanies,
  listServiceRequestNotes,
  listShipmentsForRequest,
} from "@/lib/data";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from "@/lib/types";
import Badge from "@/components/Badge";
import { addNoteAction, updateServiceRequestAction } from "../actions";

export const dynamic = "force-dynamic";

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = getServiceRequest(Number(id));
  if (!request) notFound();

  const companies = listServiceCompanies();
  const notes = listServiceRequestNotes(request.id);
  const shipments = listShipmentsForRequest(request.id);
  const updateWithId = updateServiceRequestAction.bind(null, request.id);
  const addNoteWithId = addNoteAction.bind(null, request.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/service-requests" className="text-sm text-stone-500 hover:text-hotsauce">
            ← Back to service requests
          </Link>
          <h1 className="text-2xl font-semibold text-charcoal mt-1">
            <Link href={`/locations/${request.location_id}`} className="hover:underline">
              #{request.store_number} {request.location_name}
            </Link>
          </h1>
          <p className="text-sm text-stone-500">
            {request.city}, {request.province} · Reported{" "}
            {new Date(request.reported_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Badge label={request.status} />
          <Badge label={request.priority} />
          <Link
            href={`/tickets/${request.id}`}
            target="_blank"
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Print Ticket
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form action={updateWithId} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <h2 className="font-medium text-charcoal">Request Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
              <select
                name="status"
                defaultValue={request.status}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                {SERVICE_REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Priority</label>
              <select
                name="priority"
                defaultValue={request.priority}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                {SERVICE_REQUEST_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Assigned Service Company
              </label>
              <select
                name="service_company_id"
                defaultValue={request.service_company_id ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.city ? ` (${c.city}${c.province ? ", " + c.province : ""})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Equipment
              </label>
              <input
                name="equipment_description"
                defaultValue={request.equipment_description ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Issue Description
              </label>
              <textarea
                name="issue_description"
                defaultValue={request.issue_description}
                rows={4}
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Reported By
              </label>
              <input
                name="reported_by"
                defaultValue={request.reported_by ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Cost ($)
              </label>
              <input
                name="cost"
                type="number"
                step="0.01"
                defaultValue={request.cost ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Scheduled Date
              </label>
              <input
                name="scheduled_at"
                type="date"
                defaultValue={toDateInputValue(request.scheduled_at)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Completed Date
              </label>
              <input
                name="completed_at"
                type="date"
                defaultValue={toDateInputValue(request.completed_at)}
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

        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-lg">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-medium text-charcoal">Parts Shipments</h2>
              <Link
                href={`/shipments/new?serviceRequestId=${request.id}`}
                className="text-sm text-stone-500 hover:text-hotsauce"
              >
                + Ship parts
              </Link>
            </div>
            {shipments.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500">No parts shipped for this request yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {shipments.map((s) => (
                  <li key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <Link href={`/shipments/${s.id}`} className="text-sm font-medium text-charcoal hover:underline">
                      Shipment #{s.id} {s.tracking_number ? `· ${s.tracking_number}` : ""}
                    </Link>
                    <Badge label={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-lg">
            <div className="px-4 py-3 border-b border-stone-200">
              <h2 className="font-medium text-charcoal">Timeline / Notes</h2>
            </div>
            <form action={addNoteWithId} className="px-4 py-3 border-b border-stone-100 flex gap-2">
              <input
                name="note"
                placeholder="Add a note..."
                required
                className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
              >
                Add
              </button>
            </form>
            {notes.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500">No notes yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {notes.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="text-sm text-stone-700">{n.note}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
