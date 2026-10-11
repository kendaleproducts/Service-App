import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { listAllMatters, listLawyers } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

const filters = [
  { key: "open", label: "Open" },
  { key: "intake", label: "Intake queue" },
  { key: "awaiting", label: "Awaiting client" },
  { key: "unread", label: "Unread" },
  { key: "all", label: "All" },
];

export default async function FirmMattersPage({ searchParams }: PageProps<"/firm/matters">) {
  await requireUser("staff");
  const sp = await searchParams;
  const filter = typeof sp.filter === "string" ? sp.filter : "open";
  const lawyerId = Number(sp.lawyer) || undefined;
  let matters = listAllMatters({ status: filter === "all" ? undefined : "open", lawyerId });
  if (filter === "intake") matters = matters.filter((m) => !m.conflict_cleared_at);
  if (filter === "awaiting") matters = matters.filter((m) => m.status === "engagement_pending" || m.status === "client_review" || m.balance_due_cents > 0);
  if (filter === "unread") matters = matters.filter((m) => m.unread_for_firm > 0);
  const lawyers = listLawyers();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Firm desk</p>
        <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">Matters</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Link key={f.key} href={`/firm/matters?filter=${f.key}${lawyerId ? `&lawyer=${lawyerId}` : ""}`} className={`rounded-full px-3 py-1.5 text-[11px] font-display uppercase tracking-[0.16em] ${filter === f.key ? "bg-brand-black text-white" : "bg-paper text-slate border border-stone hover:border-gold"}`}>
            {f.label}
          </Link>
        ))}
        <span className="mx-2 hidden h-5 w-px bg-stone sm:block" />
        <Link href={`/firm/matters?filter=${filter}`} className={`rounded-full px-3 py-1.5 text-[11px] font-display uppercase tracking-[0.16em] ${!lawyerId ? "bg-gold text-brand-black" : "bg-paper text-slate border border-stone hover:border-gold"}`}>Any lawyer</Link>
        {lawyers.map((l) => (
          <Link key={l.id} href={`/firm/matters?filter=${filter}&lawyer=${l.id}`} className={`rounded-full px-3 py-1.5 text-[11px] font-display uppercase tracking-[0.16em] ${lawyerId === l.id ? "bg-gold text-brand-black" : "bg-paper text-slate border border-stone hover:border-gold"}`}>
            {l.initials}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-[10px] uppercase tracking-[0.18em] text-slate">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Lawyer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Due</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {matters.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-mist">No matters match this view.</td></tr>
            )}
            {matters.map((m) => (
              <tr key={m.id} className="hover:bg-ivory">
                <td className="px-4 py-3"><Link href={`/firm/matters/${m.id}`} className="font-semibold text-brand-black hover:text-gold-deep">{m.reference}</Link></td>
                <td className="px-4 py-3">{m.client_name}{m.unread_for_firm > 0 && <span className="ml-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-brand-black">{m.unread_for_firm}</span>}</td>
                <td className="px-4 py-3 text-slate">{m.service_name}</td>
                <td className="px-4 py-3 text-slate">{m.lawyer_name ?? <span className="text-amber">Unassigned</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={m.status} audience="firm" /></td>
                <td className="px-4 py-3 text-right">{m.balance_due_cents > 0 ? formatMoney(m.balance_due_cents) : <span className="text-mist">—</span>}</td>
                <td className="px-4 py-3 text-slate">{formatDate(m.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
