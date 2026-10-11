import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { listMattersForClient, listUpcomingAppointments } from "@/lib/data";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { MATTER_STATUS_CLIENT_HINT } from "@/lib/types";

export default async function PortalDashboard() {
  const user = await requireUser("client");
  const matters = listMattersForClient(user.id);
  const upcoming = listUpcomingAppointments({ clientId: user.id, limit: 5 });
  const open = matters.filter((m) => !["completed", "closed", "cancelled"].includes(m.status));
  const past = matters.filter((m) => ["completed", "closed", "cancelled"].includes(m.status));
  const todo = open.flatMap((m) => {
    const items: { label: string; href: string }[] = [];
    if (m.status === "engagement_pending" && m.engagement_terms && !m.engagement_signed_at) items.push({ label: `Sign the engagement letter for ${m.service_name}`, href: `/portal/matters/${m.id}#engagement` });
    if (m.balance_due_cents > 0) items.push({ label: `Pay ${formatMoney(m.balance_due_cents)} on ${m.reference}`, href: `/portal/matters/${m.id}#billing` });
    if (m.status === "client_review") items.push({ label: `Review drafts on ${m.service_name}`, href: `/portal/matters/${m.id}#documents` });
    if (m.unread_for_client > 0) items.push({ label: `${m.unread_for_client} new message${m.unread_for_client > 1 ? "s" : ""} on ${m.reference}`, href: `/portal/matters/${m.id}#messages` });
    return items;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Client portal</p>
          <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">Welcome back, {user.name.split(" ")[0]}</h1>
        </div>
        <Link href="/services" className="btn-outline btn-sm">
          Start a new matter
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {todo.length > 0 && (
            <section className="card border-gold/50 p-5">
              <h2 className="text-sm uppercase tracking-[0.2em] text-gold-deep">Needs your attention</h2>
              <ul className="mt-3 divide-y divide-stone">
                {todo.map((t) => (
                  <li key={t.href + t.label}>
                    <Link href={t.href} className="flex items-center justify-between py-3 text-sm text-ink hover:text-gold-deep">
                      <span>{t.label}</span>
                      <span className="text-gold">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Your matters</h2>
            {open.length === 0 && (
              <div className="card mt-3 p-8 text-center text-sm text-slate">
                You have no open matters. <Link href="/services" className="text-gold-deep underline">Browse services</Link> to start one.
              </div>
            )}
            <ul className="mt-3 space-y-3">
              {open.map((m) => (
                <li key={m.id}>
                  <Link href={`/portal/matters/${m.id}`} className="card block p-5 transition-colors hover:border-gold">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-mist">{m.reference}</p>
                        <h3 className="mt-1 text-lg normal-case tracking-normal text-brand-black">{m.service_name}</h3>
                        <p className="mt-1 text-sm text-slate">{m.lawyer_name ? `With ${m.lawyer_name}` : "Lawyer to be assigned"} · Updated {formatDate(m.updated_at)}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate">{MATTER_STATUS_CLIENT_HINT[m.status]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Completed</h2>
              <ul className="mt-3 divide-y divide-stone rounded-xl border border-stone bg-paper">
                {past.map((m) => (
                  <li key={m.id}>
                    <Link href={`/portal/matters/${m.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-ivory">
                      <span>
                        <span className="text-mist">{m.reference}</span> · {m.service_name}
                      </span>
                      <StatusBadge status={m.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card-dark p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-gold">Upcoming meetings</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No video meetings booked.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {upcoming.map((a) => (
                  <li key={a.id} className="border-t border-white/10 pt-3 text-sm">
                    <p className="font-semibold">{formatDateTime(a.starts_at)}</p>
                    <p className="text-white/70">{a.purpose}{a.lawyer_name ? ` · ${a.lawyer_name}` : ""}</p>
                    <Link href={`/portal/meet/${a.id}`} className="mt-2 inline-block text-xs uppercase tracking-[0.16em] text-gold hover:underline">
                      Join video room →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-5 text-sm text-slate">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Need help?</h2>
            <p className="mt-2">Message your lawyer from inside any matter. For anything urgent, call the office at 905-688-9411.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
