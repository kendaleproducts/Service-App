import Link from "next/link";
import { DEFAULT_FLEET_THRESHOLDS, getFleetReport, type FleetUnit } from "@/lib/data";
import { REPORT_PRESETS, resolveReportPeriod } from "@/lib/reportPeriods";
import Badge from "@/components/Badge";
import ClickableRow from "@/components/ClickableRow";
import PrintButton from "@/components/PrintButton";
import ReportTabs from "../ReportTabs";

export const dynamic = "force-dynamic";

function money(n: number) {
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function num(value: string | undefined, fallback: number) {
  const n = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

function SummaryCard({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string | number;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${highlight ? "text-hickory" : "text-charcoal"}`}>
        {value}
      </p>
      {note && <p className="text-xs text-stone-500 mt-1">{note}</p>}
    </div>
  );
}

function UnitTable({
  title,
  description,
  units,
  emptyText,
  showReasons,
}: {
  title: string;
  description: string;
  units: FleetUnit[];
  emptyText: string;
  showReasons?: boolean;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
      <div className="px-4 py-3 border-b border-stone-200">
        <h2 className="font-medium text-charcoal">
          {title} ({units.length})
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-stone-500 border-b border-stone-100">
            <th className="px-4 py-2 font-medium">Unit</th>
            <th className="px-4 py-2 font-medium">Location</th>
            <th className="px-4 py-2 font-medium">Calls (period)</th>
            <th className="px-4 py-2 font-medium">Cost (period)</th>
            <th className="px-4 py-2 font-medium">Cost (lifetime)</th>
            <th className="px-4 py-2 font-medium">Age</th>
            {showReasons ? (
              <>
                <th className="px-4 py-2 font-medium">Why</th>
                <th className="px-4 py-2 font-medium">Replacement</th>
              </>
            ) : (
              <th className="px-4 py-2 font-medium">Status</th>
            )}
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <ClickableRow
              key={u.id}
              href={`/equipment/${u.id}`}
              className="border-b border-stone-50 last:border-0 hover:bg-stone-50"
            >
              <td className="px-4 py-2">
                <Link href={`/equipment/${u.id}`} className="text-charcoal hover:underline">
                  {u.serial_number}
                </Link>
                {u.description && (
                  <span className="block text-xs text-stone-500">{u.description}</span>
                )}
              </td>
              <td className="px-4 py-2 text-stone-600">
                #{u.store_number} {u.location_name}
                {u.province && <span className="text-stone-400"> · {u.province}</span>}
              </td>
              <td className="px-4 py-2 text-stone-600">{u.period_requests}</td>
              <td className="px-4 py-2 text-stone-600">{money(u.period_cost)}</td>
              <td className="px-4 py-2 text-stone-600">{money(u.lifetime_cost)}</td>
              <td className="px-4 py-2 text-stone-600">
                {u.age_years != null ? `${u.age_years} yr` : "—"}
              </td>
              {showReasons ? (
                <>
                  <td className="px-4 py-2 text-stone-600 text-xs max-w-xs">
                    {u.reasons.join("; ")}
                  </td>
                  <td className="px-4 py-2 text-stone-600">
                    {u.replacement_cost != null ? (
                      money(u.replacement_cost)
                    ) : (
                      <span className="text-hickory text-xs">Estimate needed</span>
                    )}
                  </td>
                </>
              ) : (
                <td className="px-4 py-2">
                  <Badge label={u.status} />
                </td>
              )}
            </ClickableRow>
          ))}
          {units.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function FleetReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    highCost?: string;
    repeat?: string;
    life?: string;
    ratio?: string;
  }>;
}) {
  const params = await searchParams;
  const { preset, from, to } = resolveReportPeriod(params, "this-quarter");

  const thresholds = {
    highCost: num(params.highCost, DEFAULT_FLEET_THRESHOLDS.highCost),
    repeat: num(params.repeat, DEFAULT_FLEET_THRESHOLDS.repeat),
    lifeYears: num(params.life, DEFAULT_FLEET_THRESHOLDS.lifeYears),
    costRatio: num(params.ratio, DEFAULT_FLEET_THRESHOLDS.costRatio * 100) / 100,
  };

  const report = getFleetReport({ from, to, thresholds });
  const activeUnits = report.units.length - report.retiredCount;
  const missingData = report.units.filter(
    (u) => u.status !== "Retired" && (u.installed_year == null || u.replacement_cost == null)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Fleet Report</h1>
          <p className="text-sm text-stone-500 mt-1">
            {from && to ? `${from} to ${to}` : "All time"} · {activeUnits} active unit(s)
            {report.retiredCount > 0 ? `, ${report.retiredCount} retired` : ""}
          </p>
        </div>
        <PrintButton label="Print Report" />
      </div>

      <ReportTabs active="fleet" />

      <div className="no-print flex flex-wrap gap-2">
        {REPORT_PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/reports/fleet?preset=${p.key}`}
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
          <label className="block text-xs font-medium text-stone-500 mb-1">
            High cost ≥ ($, period)
          </label>
          <input
            type="number"
            name="highCost"
            min="0"
            step="50"
            defaultValue={thresholds.highCost}
            className="w-32 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Repeat ≥ (calls, period)
          </label>
          <input
            type="number"
            name="repeat"
            min="1"
            step="1"
            defaultValue={thresholds.repeat}
            className="w-28 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Expected life (years)
          </label>
          <input
            type="number"
            name="life"
            min="1"
            step="1"
            defaultValue={thresholds.lifeYears}
            className="w-28 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Replace at (% of cost, lifetime)
          </label>
          <input
            type="number"
            name="ratio"
            min="1"
            max="500"
            step="5"
            defaultValue={Math.round(thresholds.costRatio * 100)}
            className="w-28 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-hotsauce px-4 py-2 text-sm font-medium text-white hover:bg-hickory"
        >
          Generate Report
        </button>
      </form>

      {missingData > 0 && (
        <p className="no-print text-xs text-stone-500">
          {missingData} active unit(s) are missing an installed year or replacement cost, so age
          and capital figures for them can&apos;t be calculated. Open a unit from any table below
          to fill those in.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="High Service Cost" value={report.highCost.length} highlight />
        <SummaryCard label="Repeat Failures" value={report.repeatFailures.length} highlight />
        <SummaryCard label="Obsolete" value={report.obsolete.length} />
        <SummaryCard label="Recommended Replacements" value={report.recommended.length} />
        <SummaryCard
          label="Capital Required"
          value={money(report.capital.total)}
          note={
            report.capital.missingEstimates > 0
              ? `+ ${report.capital.missingEstimates} unit(s) without an estimate`
              : undefined
          }
        />
      </div>

      <UnitTable
        title="High-service-cost units"
        description={`Service cost of ${money(thresholds.highCost)} or more in the period.`}
        units={report.highCost}
        emptyText="No units crossed the cost threshold in this period."
      />

      <UnitTable
        title="Repeat failures"
        description={`${thresholds.repeat} or more service calls in the period.`}
        units={report.repeatFailures}
        emptyText="No repeat failures in this period."
      />

      <UnitTable
        title="Obsolete equipment"
        description={`Marked obsolete, or ${thresholds.lifeYears}+ years since installation.`}
        units={report.obsolete}
        emptyText="No obsolete units on file."
      />

      <UnitTable
        title="Recommended equipment replacements"
        description={`Obsolete, lifetime service cost at ${Math.round(
          thresholds.costRatio * 100
        )}%+ of replacement cost, or ${thresholds.repeat + 1}+ calls in the last 12 months.`}
        units={report.recommended}
        emptyText="No replacements recommended right now."
        showReasons
      />

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
        <div className="px-4 py-3 border-b border-stone-200">
          <h2 className="font-medium text-charcoal">Upcoming capital requirements</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Replacement cost of every recommended unit, by province.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500 border-b border-stone-100">
              <th className="px-4 py-2 font-medium">Province</th>
              <th className="px-4 py-2 font-medium">Units</th>
              <th className="px-4 py-2 font-medium">Estimated Cost</th>
              <th className="px-4 py-2 font-medium">Without Estimate</th>
            </tr>
          </thead>
          <tbody>
            {report.capital.byProvince.map((row) => (
              <tr key={row.province} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-2 text-charcoal">{row.province}</td>
                <td className="px-4 py-2 text-stone-600">{row.count}</td>
                <td className="px-4 py-2 text-stone-600">{money(row.total)}</td>
                <td className="px-4 py-2 text-stone-600">{row.missing || "—"}</td>
              </tr>
            ))}
            {report.capital.byProvince.length > 0 && (
              <tr className="border-t border-stone-300 font-semibold">
                <td className="px-4 py-2 text-charcoal">Total</td>
                <td className="px-4 py-2 text-charcoal">{report.recommended.length}</td>
                <td className="px-4 py-2 text-charcoal">{money(report.capital.total)}</td>
                <td className="px-4 py-2 text-charcoal">
                  {report.capital.missingEstimates || "—"}
                </td>
              </tr>
            )}
            {report.capital.byProvince.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  No capital requirements identified.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UnitTable
        title="All equipment on file"
        description="Every unit, including retired."
        units={report.units}
        emptyText="No equipment on file yet. Units are added when a service request is logged against a machine."
      />
    </div>
  );
}
