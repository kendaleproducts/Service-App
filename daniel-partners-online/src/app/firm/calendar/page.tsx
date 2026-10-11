import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { listUpcomingAppointments } from "@/lib/data";
import { formatDateLong, formatTime } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { setMeetingStatus } from "../actions";

export default async function FirmCalendarPage() {
  await requireUser("staff");
  const upcoming = listUpcomingAppointments({ limit: 100 });
  const byDay = new Map<string, typeof upcoming>();
  for (const a of upcoming) {
    const key = formatDateLong(a.starts_at);
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Firm desk</p>
        <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">Video calendar</h1>
        <p className="mt-1 text-sm text-slate">All scheduled client meetings, Eastern time. Production syncs these to each lawyer&apos;s Outlook or Google calendar.</p>
      </div>
      {byDay.size === 0 && <p className="card p-6 text-sm text-mist">No upcoming meetings.</p>}
      {[...byDay.entries()].map(([day, items]) => (
        <section key={day}>
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate">{day}</h2>
          <ul className="mt-3 divide-y divide-stone rounded-xl border border-stone bg-paper">
            {items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{formatTime(a.starts_at)} · {a.duration_minutes} min · {a.client_name}</p>
                  <p className="text-xs text-slate">{a.purpose} · {a.service_name}{a.lawyer_name ? ` · ${a.lawyer_name}` : ""} · <Link href={`/firm/matters/${a.matter_id}`} className="text-gold-deep hover:underline">{a.matter_reference}</Link></p>
                </div>
                <form action={setMeetingStatus} className="flex gap-2">
                  <input type="hidden" name="appointment_id" value={a.id} />
                  <input type="hidden" name="matter_id" value={a.matter_id} />
                  <SubmitButton name="status" value="completed" className="btn-outline btn-sm" pendingText="…">Completed</SubmitButton>
                  <SubmitButton name="status" value="cancelled" className="btn-ghost btn-sm" pendingText="…">Cancel</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
