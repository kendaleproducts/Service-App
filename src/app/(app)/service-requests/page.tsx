import Link from "next/link";
import { listServiceRequests } from "@/lib/data";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from "@/lib/types";
import ServiceRequestRow from "./ServiceRequestRow";

export const dynamic = "force-dynamic";

export default async function ServiceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const requests = listServiceRequests({
    q: params.q,
    status: params.status,
    priority: params.priority,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Service Requests</h1>
          <p className="text-sm text-stone-500 mt-1">{requests.length} request(s)</p>
        </div>
        <Link
          href="/service-requests/new"
          className="rounded-md bg-hotsauce px-3 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          New Service Request
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 bg-white border border-stone-200 rounded-lg p-4">
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search store #, name, city..."
          className="flex-1 min-w-[200px] rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {SERVICE_REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="priority"
          defaultValue={params.priority ?? ""}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          {SERVICE_REQUEST_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">Issue</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <ServiceRequestRow key={r.id} r={r} />
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No service requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
