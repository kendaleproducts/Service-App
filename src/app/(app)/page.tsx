import Link from "next/link";
import { getDashboardStats } from "@/lib/data";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`text-3xl font-semibold mt-1 ${
          highlight && value > 0 ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

export default async function DashboardPage() {
  const stats = getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Mary Brown&apos;s service operations, managed from Fort Erie, ON.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Open Requests" value={stats.openRequests} href="/service-requests" />
        <StatCard
          label="Urgent"
          value={stats.urgentRequests}
          href="/service-requests?priority=Urgent"
          highlight
        />
        <StatCard
          label="Low Stock Parts"
          value={stats.lowStockParts}
          href="/parts?lowStock=1"
          highlight
        />
        <StatCard
          label="Shipments In Transit"
          value={stats.shipmentsInTransit}
          href="/shipments"
        />
        <StatCard label="Active Locations" value={stats.totalLocations} href="/locations" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Recent Service Requests</h2>
          <Link href="/service-requests" className="text-sm text-slate-500 hover:text-slate-900">
            View all
          </Link>
        </div>
        {stats.recentRequests.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No service requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Issue</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Company</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRequests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2">
                    <Link href={`/service-requests/${r.id}`} className="text-slate-900 hover:underline">
                      #{r.store_number} {r.location_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600 max-w-xs truncate">
                    {r.issue_description}
                  </td>
                  <td className="px-4 py-2">
                    <Badge label={r.status} />
                  </td>
                  <td className="px-4 py-2">
                    <Badge label={r.priority} />
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {r.service_company_name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
