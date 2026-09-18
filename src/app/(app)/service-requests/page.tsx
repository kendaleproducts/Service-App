import Link from "next/link";
import { listServiceRequests } from "@/lib/data";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from "@/lib/types";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function ServiceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const requests = listServiceRequests({ status: params.status, priority: params.priority });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
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
              <tr key={r.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <Link href={`/service-requests/${r.id}`} className="text-charcoal hover:underline">
                    #{r.store_number} {r.location_name}
                  </Link>
                  <div className="text-xs text-stone-500">
                    {r.city}
                    {r.province ? `, ${r.province}` : ""}
                  </div>
                </td>
                <td className="px-4 py-2 text-stone-600 max-w-xs truncate">{r.issue_description}</td>
                <td className="px-4 py-2">
                  <Badge label={r.status} />
                </td>
                <td className="px-4 py-2">
                  <Badge label={r.priority} />
                </td>
                <td className="px-4 py-2 text-stone-600">{r.service_company_name ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">
                  {new Date(r.reported_at).toLocaleDateString()}
                </td>
              </tr>
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
