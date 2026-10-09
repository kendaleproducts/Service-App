import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getServiceRequest,
  listParts,
  listPartsForRequest,
  listServiceCompanies,
  listServiceRequestNotes,
  listVisitsForRequest,
} from "@/lib/data";
import {
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_STATUSES,
  VISIT_OUTCOMES,
} from "@/lib/types";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { isAdmin } from "@/lib/session";
import PartsField from "../PartsField";
import {
  addNoteAction,
  addVisitAction,
  closeServiceRequestAction,
  deleteServiceRequestAction,
  deleteVisitAction,
  reopenServiceRequestAction,
  updateServiceRequestAction,
} from "../actions";
import CloseTicketForm from "./CloseTicketForm";

export const dynamic = "force-dynamic";

const PROGRESS_STEPS = ["New", "Scheduled", "In Progress", "Awaiting Parts", "Completed"];

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function daysBetween(from: string, to: string | null): number {
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function money(n: number) {
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const parts = listParts();
  const requestParts = listPartsForRequest(request.id);
  const visits = listVisitsForRequest(request.id);
  const admin = await isAdmin();

  const closed = request.status === "Completed";
  const cancelled = request.status === "Cancelled";
  const open = !closed && !cancelled;
  const visitsTotal = visits.reduce((sum, v) => sum + (v.amount ?? 0), 0);
  const otherCharges = request.cost ?? 0;
  const total = visitsTotal + otherCharges;
  const daysOpen = daysBetween(request.reported_at, request.completed_at);
  const stepIndex = PROGRESS_STEPS.indexOf(request.status);
  const today = new Date().toISOString().slice(0, 10);
  // Closing goes through the Close Ticket form, so it's not a dropdown choice.
  const statusOptions = SERVICE_REQUEST_STATUSES.filter((s) => s !== "Completed" || closed);

  const updateWithId = updateServiceRequestAction.bind(null, request.id);
  const addNoteWithId = addNoteAction.bind(null, request.id);
  const addVisitWithId = addVisitAction.bind(null, request.id);
  const closeWithId = closeServiceRequestAction.bind(null, request.id);
  const reopenWithId = reopenServiceRequestAction.bind(null, request.id);
  const deleteWithId = deleteServiceRequestAction.bind(null, request.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackLink fallbackHref="/service-requests" label="Back to service requests" />
          <h1 className="text-2xl font-semibold text-charcoal mt-1">
            <Link href={`/locations/${request.location_id}`} className="hover:underline">
              #{request.store_number} {request.location_name}
            </Link>
          </h1>
          <p className="text-sm text-stone-500">
            {[request.city, request.province].filter(Boolean).join(", ")}
            {request.city || request.province ? " · " : ""}Ticket #{request.id} · Reported{" "}
            {new Date(request.reported_at).toLocaleDateString()}
            {request.equipment_serial_number && (
              <>
                {" "}· Unit{" "}
                <Link href={`/equipment/${request.equipment_id}`} className="hover:underline">
                  {request.equipment_serial_number}
                </Link>
              </>
            )}
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
          {closed && (
            <ConfirmSubmitButton
              action={reopenWithId}
              label="Reopen Ticket"
              variant="neutral"
              confirmMessage="Reopen this ticket? It goes back to In Progress and the resolution is cleared."
            />
          )}
          {admin && (
            <ConfirmSubmitButton
              action={deleteWithId}
              label="Delete Request"
              confirmMessage={`Permanently delete this service request for #${request.store_number} ${request.location_name}? This also removes its visits, notes and parts list, and its ticket can no longer be printed. This cannot be undone.`}
            />
          )}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg px-4 py-3">
        {cancelled ? (
          <p className="text-sm text-stone-500">This request was cancelled.</p>
        ) : (
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {PROGRESS_STEPS.map((step, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <li key={step} className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      current
                        ? "bg-hotsauce text-white"
                        : done
                          ? "bg-charcoal text-white"
                          : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className={`text-sm ${
                      current ? "font-semibold text-charcoal" : done ? "text-charcoal" : "text-stone-400"
                    }`}
                  >
                    {step}
                  </span>
                  {i < PROGRESS_STEPS.length - 1 && (
                    <span className="mx-1 h-px w-6 bg-stone-300" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-xs text-stone-500 mt-2">
          {closed ? `Closed after ${daysOpen} day(s)` : `Open ${daysOpen} day(s)`} ·{" "}
          {visits.length} visit(s) · {money(total)} billed to date
        </p>
      </div>

      {closed && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Closed {request.completed_at ? new Date(request.completed_at).toLocaleDateString() : ""}
          </p>
          <p className="text-sm text-green-900 mt-1">{request.resolution ?? "No resolution recorded."}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Keyed so the form remounts with fresh defaults after a visit or close changes the status server-side. */}
        <form
          key={`${request.status}-${request.updated_at}`}
          action={updateWithId}
          className="bg-white border border-stone-200 rounded-lg p-5 space-y-4"
        >
          <h2 className="font-medium text-charcoal">Request Details</h2>
          <fieldset disabled={!open} className="min-w-0 space-y-4 border-0 p-0 m-0 disabled:opacity-70">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={request.status}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                >
                  {statusOptions.map((s) => (
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
                      {c.name}
                      {c.city ? ` (${c.city}${c.province ? ", " + c.province : ""})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-1">Equipment</label>
                <input
                  name="equipment_description"
                  defaultValue={request.equipment_description ?? ""}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <PartsField parts={parts} initialItems={requestParts} />
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
                <label className="block text-xs font-medium text-stone-500 mb-1">Reported By</label>
                <input
                  name="reported_by"
                  defaultValue={request.reported_by ?? ""}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Other Charges ($)
                </label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  defaultValue={request.cost ?? ""}
                  placeholder="Parts, shipping, anything not on a visit"
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
            {open && (
              <button
                type="submit"
                className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
              >
                Save Changes
              </button>
            )}
          </fieldset>
          {!open && (
            <p className="text-xs text-stone-500">
              {closed ? "Closed tickets are read-only. Reopen it to make changes." : "Cancelled tickets are read-only."}
            </p>
          )}
        </form>

        <div className="space-y-6">
          {open && <CloseTicketForm action={closeWithId} />}

          <div className="bg-white border border-stone-200 rounded-lg">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-medium text-charcoal">Visits</h2>
              <span className="text-xs text-stone-500">
                {visits.length} · {money(visitsTotal)}
              </span>
            </div>

            {open && (
              <form action={addVisitWithId} className="px-4 py-3 border-b border-stone-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="visited_on"
                    type="date"
                    required
                    defaultValue={today}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <select
                    name="outcome"
                    required
                    defaultValue=""
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Outcome...
                    </option>
                    {VISIT_OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <select
                    name="service_company_id"
                    defaultValue={request.service_company_id ?? ""}
                    className="col-span-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
                  >
                    <option value="">Service company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount billed ($)"
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="invoice_ref"
                    placeholder="Invoice / reference #"
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="work_performed"
                    required
                    rows={2}
                    placeholder="Work performed on this visit"
                    className="col-span-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
                >
                  Log Visit
                </button>
              </form>
            )}

            {visits.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500">No visits logged yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {visits.map((v) => (
                  <li key={v.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {new Date(v.visited_on + "T00:00:00").toLocaleDateString()} · {v.outcome}
                        </p>
                        <p className="text-sm text-stone-700 mt-0.5">{v.work_performed}</p>
                        <p className="text-xs text-stone-500 mt-1">
                          {v.service_company_name ?? "Company not recorded"}
                          {v.amount != null ? ` · ${money(v.amount)}` : ""}
                          {v.invoice_ref ? ` · Inv ${v.invoice_ref}` : ""}
                        </p>
                      </div>
                      {admin && open && (
                        <ConfirmSubmitButton
                          action={deleteVisitAction.bind(null, request.id, v.id)}
                          label="Remove"
                          variant="neutral"
                          confirmMessage="Remove this visit? Its billed amount comes off the ticket total. This cannot be undone."
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-lg">
            <div className="px-4 py-3 border-b border-stone-200">
              <h2 className="font-medium text-charcoal">Notes</h2>
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
