import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { getUserById, listMattersForClient } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function FirmClientPage({ params }: PageProps<"/firm/clients/[id]">) {
  await requireUser("staff");
  const { id } = await params;
  const client = getUserById(Number(id));
  if (!client || client.role !== "client") notFound();
  const matters = listMattersForClient(client.id);
  return (
    <div className="space-y-6">
      <Link href="/firm/clients" className="text-xs uppercase tracking-[0.18em] text-slate hover:text-gold-deep">← Clients</Link>
      <div>
        <p className="eyebrow">Client</p>
        <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">{client.name}</h1>
        <p className="mt-1 text-sm text-slate">{client.email} · {client.phone ?? "no phone"} · {client.city ?? "—"}{client.province ? `, ${client.province}` : ""} · client since {formatDate(client.created_at)}</p>
      </div>
      <ul className="divide-y divide-stone rounded-xl border border-stone bg-paper">
        {matters.length === 0 && <li className="px-5 py-6 text-sm text-mist">No matters.</li>}
        {matters.map((m) => (
          <li key={m.id}>
            <Link href={`/firm/matters/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-ivory">
              <span><span className="text-mist">{m.reference}</span> · {m.service_name}{m.lawyer_name ? ` · ${m.lawyer_name}` : ""}</span>
              <span className="flex items-center gap-3">
                {m.balance_due_cents > 0 && <span className="text-amber">{formatMoney(m.balance_due_cents)} due</span>}
                <StatusBadge status={m.status} audience="firm" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
