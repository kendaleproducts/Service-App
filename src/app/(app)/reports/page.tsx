import Link from "next/link";
import { getServiceRequestReport, listProvinces, listServiceCompanies } from "@/lib/data";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from "@/lib/types";
import Badge from "@/components/Badge";
import ClickableRow from "@/components/ClickableRow";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const PRESETS = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "this-quarter", label: "This Quarter" },
  { key: "last-quarter", label: "Last Quarter" },
  { key: "this-year", label: "This Year" },
  { key: "all-time", label: "All Time" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmt(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function resolvePreset(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  switch (preset) {
    case "this-month":
      return { from: fmt(y, m, 1), to: fmt(y, m, lastDayOfMonth(y, m)) };
    case "last-month": {
      const ly = m === 0 ? y - 1 : y;
      const lm = m === 0 ? 11 : m - 1;
      return { from: fmt(ly, lm, 1), to: fmt(ly, lm, lastDayOfMonth(ly, lm)) };
    }
    case "this-quarter": {
      const q = Math.floor(m / 3);
      const qm = q * 3;
      return { from: fmt(y, qm, 1), to: fmt(y, qm + 2, lastDayOfMonth(y, qm + 2)) };
    }
    case "last-quarter": {
      let q = Math.floor(m / 3) - 1;
      let qy = y;
      if (q < 0) {
        q = 3;
        qy = y - 1;
      }
      const qm = q * 3;
      return { from: fmt(qy, qm, 1), to: fmt(qy, qm + 2, lastDayOfMonth(qy, qm + 2)) };
    }
    case "this-year":
      return { from: fmt(y, 0, 1), to: fmt(y, 11, 31) };
    default:
      return null;
  }
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-2xl font-semibold text-charcoal mt-1">{value}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg">
      <div className="px-4 py-3 border-b border-stone-200">
        <h2 className="font-medium text-charcoal text-sm">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-stone-500">No data.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li
              key={item.label}
              className="px-4 py-2 flex items-center justify-between text-sm"
            >
              <span className="text-stone-700">{item.label}</span>
              <span className="font-medium text-charcoal">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    status?: string;
    priority?: string;
    province?: string;
    companyId?: string;
  }>;
}) {
  const params = await searchParams;
  const hasCustomRange = Boolean(params.from || params.to);
  const preset = params.preset ?? (hasCustomRange ? undefined : "this-month");
  const presetRange = preset && preset !== "all-time" ? resolvePreset(preset) : null;

  const from = params.from || presetRange?.from;
  const to = params.to || presetRange?.to;

  const report = getServiceRequestReport({
    from,
    to,
    status: params.status,
    priority: params.priority,
    province: params.province,
    companyId: params.companyId ? Number(params.companyId) : undefined,
  });

  const provinces = listProvinces();
  const companies = listServiceCompanies();
  const completedCount = report.byStatus.find((s) => s.label === "Completed")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Service Request Report</h1>
          <p className="text-sm text-stone-500 mt-1">
            {from && to ? `${from} to ${to}` : "All time"}
          </p>
        </div>
        <PrintButton label="Print Report" />
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/reports?preset=${p.key}`}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              preset === p.key
                ? "bg-hotsauce text-white border-hotsauce"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <form className="no-print flex flex-wrap items-end gap-3 bg-white border border-stone-200 rounded-lg p-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">From</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">To</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
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
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Priority</label>
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
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Province</label>
          <select
            name="province"
            defaultValue={params.province ?? ""}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">All provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Service Company
          </label>
          <select
            name="companyId"
            defaultValue={params.companyId ?? ""}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Generate Report
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Requests" value={report.totalCount} />
        <SummaryCard label="Completed" value={completedCount} />
        <SummaryCard label="Total Cost" value={`$${report.totalCost.toFixed(2)}`} />
        <SummaryCard
          label="Avg Cost / Request"
          value={report.avgCost != null ? `$${report.avgCost.toFixed(2)}` : "—"}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <BreakdownCard title="By Status" items={report.byStatus} />
        <BreakdownCard title="By Priority" items={report.byPriority} />
        <BreakdownCard title="By Service Company" items={report.byCompany} />
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
        <div className="px-4 py-3 border-b border-stone-200">
          <h2 className="font-medium text-charcoal">Requests ({report.totalCount})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">Issue</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Cost</th>
              <th className="px-4 py-2 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {report.requests.map((r) => (
              <ClickableRow
                key={r.id}
                href={`/service-requests/${r.id}`}
                className="border-b border-stone-50 last:border-0 hover:bg-stone-50"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/service-requests/${r.id}`}
                    className="text-charcoal hover:underline"
                  >
                    #{r.store_number} {r.location_name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-stone-600 max-w-xs truncate">
                  {r.issue_description}
                </td>
                <td className="px-4 py-2">
                  <Badge label={r.status} />
                </td>
                <td className="px-4 py-2">
                  <Badge label={r.priority} />
                </td>
                <td className="px-4 py-2 text-stone-600">{r.service_company_name ?? "—"}</td>
                <td className="px-4 py-2 text-stone-600">
                  {r.cost != null ? `$${r.cost.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-2 text-stone-600">
                  {new Date(r.reported_at).toLocaleDateString()}
                </td>
              </ClickableRow>
            ))}
            {report.requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  No service requests in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
