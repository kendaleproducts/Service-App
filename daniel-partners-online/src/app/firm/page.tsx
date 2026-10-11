import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { firmStats, listAllMatters, listUpcomingAppointments } from "@/lib/data";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function FirmDashboard() {
  const user = await requireUser("staff");
  const stats = firmStats();
  const open = listAllMatters({ status: "open" });
  const queue = open.filter((m) => !m.conflict_cleared_at);
  const mine = user.lawyer_id ? open.filter((m) => m.lawyer_id === user.lawyer_id) : [];
  const unread = open.filter((m) => m.unread_for_firm > 0);
  const upcoming = listUpcomingAppointments({ limit: 6 });

  const tiles = [
    { k: "New intakes", v: stats.newIntakes, href: "/firm/matters?filter=intake" },
    { k: "Open matters", v: stats.open, href: "/firm/matters" },
    { k: "Awaiting client", v: stats.awaitingClient, href: "/firm/matters?filter=awaiting" },
    { k: "Unread messages", v: stats.unreadMessages, href: "/firm/matters?filter=unread" },
    { k: "Outstanding", v: formatMoney(stats.outstandingCents), href: "/firm/matters" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Firm desk</p>
        <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">Good day, {user.name.split(" ")[0]}</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.k} href={t.href} className="card p-4 hover:border-gold">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate">{t.k}</p>
            <p className="mt-1 font-serif text-3xl text-brand-black">{t.v}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Intake queue · conflict check pending</h2>
            <MatterList matters={queue} empty="Nothing waiting. Every intake has been cleared." />
          </section>
          {user.lawyer_id && (
            <section>
              <h2 className="text-sm uppercase tracking-[0.2em] text-slate">My matters</h2>
              <MatterList matters={mine} empty="No open matters assigned to you." />
            </section>
          )}
          <section>
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Unread client messages</h2>
            <MatterList matters={unread} empty="Inbox zero." />
          </section>
        </div>
        <aside className="card-dark p-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-gold">Upcoming video meetings</h2>
          <ul className="mt-3 space-y-3">
            {upcoming.length === 0 && <li className="text-sm text-white/60">None scheduled.</li>}
            {upcoming.map((a) => (
              <li key={a.id} className="border-t border-white/10 pt-3 text-sm">
                <p className="font-semibold">{formatDateTime(a.starts_at)}</p>
                <p className="text-white/70">{a.client_name} · {a.service_name}</p>
                <p className="text-xs text-white/50">{a.purpose}{a.lawyer_name ? ` · ${a.lawyer_name}` : ""}</p>
                <Link href={`/firm/matters/${a.matter_id}`} className="mt-1 inline-block text-xs uppercase tracking-[0.16em] text-gold hover:underline">Open matter →</Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function MatterList({ matters, empty }: { matters: ReturnType<typeof listAllMatters>; empty: string }) {
  if (matters.length === 0) return <p className="card mt-3 p-5 text-sm text-mist">{empty}</p>;
  return (
    <ul className="mt-3 divide-y divide-stone rounded-xl border border-stone bg-paper">
      {matters.map((m) => (
        <li key={m.id}>
          <Link href={`/firm/matters/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-ivory">
            <div>
              <p className="font-semibold text-ink">
                {m.client_name} <span className="font-normal text-mist">· {m.reference}</span>
              </p>
              <p className="text-xs text-slate">{m.service_name}{m.lawyer_name ? ` · ${m.lawyer_name}` : " · unassigned"} · {formatRelative(m.updated_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {m.unread_for_firm > 0 && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-brand-black">{m.unread_for_firm}</span>}
              <StatusBadge status={m.status} audience="firm" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
