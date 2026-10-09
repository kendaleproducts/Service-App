export const REPORT_PRESETS = [
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

export function resolvePreset(preset: string): { from: string; to: string } | null {
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

/** Resolves the period from either a preset key or explicit from/to params. */
export function resolveReportPeriod(
  params: { preset?: string; from?: string; to?: string },
  defaultPreset: string
): { preset: string | undefined; from: string | undefined; to: string | undefined } {
  const hasCustomRange = Boolean(params.from || params.to);
  const preset = params.preset ?? (hasCustomRange ? undefined : defaultPreset);
  const presetRange = preset && preset !== "all-time" ? resolvePreset(preset) : null;
  return {
    preset,
    from: params.from || presetRange?.from,
    to: params.to || presetRange?.to,
  };
}
