import { firm } from "@/lib/brand";

const TZ = firm.timeZone;

/** Offset in minutes of the firm's time zone at the given instant (e.g. -240 for EDT). */
function tzOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = parts?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Builds a UTC Date for a wall-clock time in the firm's time zone. */
export function zonedDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = tzOffsetMinutes(guess);
  const adjusted = new Date(guess.getTime() - offset * 60_000);
  // Re-check in case the guess straddled a DST change.
  const offset2 = tzOffsetMinutes(adjusted);
  return offset2 === offset ? adjusted : new Date(guess.getTime() - offset2 * 60_000);
}

export type Slot = { iso: string; dayKey: string };

export type SlotDay = {
  dayKey: string; // YYYY-MM-DD in firm time
  label: string;
  slots: Slot[];
};

const OPEN_MINUTES = 9 * 60 + 30; // 9:30
const CLOSE_MINUTES = 16 * 60; // last start 15:30 for 30 min
const STEP = 30;

function ymdInTz(d: Date): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    weekday: weekdayMap[get("weekday").slice(0, 3)] ?? 0,
  };
}

/**
 * Open 30-minute video slots for the next `businessDays` business days,
 * starting tomorrow, excluding the ISO start times in `taken`.
 */
export function availableSlots(taken: Set<string>, businessDays = 8, durationMinutes = 30): SlotDay[] {
  const days: SlotDay[] = [];
  const cursor = new Date();
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  let guard = 0;
  while (days.length < businessDays && guard++ < 40) {
    const { y, m, d, weekday } = ymdInTz(cursor);
    if (weekday !== 0 && weekday !== 6) {
      const dayKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const slots: Slot[] = [];
      for (let t = OPEN_MINUTES; t + durationMinutes <= CLOSE_MINUTES + STEP; t += STEP) {
        const start = zonedDate(y, m, d, Math.floor(t / 60), t % 60);
        const iso = start.toISOString();
        if (!taken.has(iso)) slots.push({ iso, dayKey });
      }
      days.push({
        dayKey,
        label: new Intl.DateTimeFormat("en-CA", {
          timeZone: TZ,
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(zonedDate(y, m, d, 12, 0)),
        slots,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
