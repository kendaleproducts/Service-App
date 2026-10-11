import Link from "next/link";
import { listClients } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function FirmClientsPage() {
  await requireUser("staff");
  const clients = listClients();
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Firm desk</p>
        <h1 className="mt-2 text-3xl normal-case tracking-normal text-brand-black">Clients</h1>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-[10px] uppercase tracking-[0.18em] text-slate">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3 text-right">Open</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-ivory">
                <td className="px-4 py-3"><Link href={`/firm/clients/${c.id}`} className="font-semibold text-brand-black hover:text-gold-deep">{c.name}</Link></td>
                <td className="px-4 py-3 text-slate">{c.email}</td>
                <td className="px-4 py-3 text-slate">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate">{c.city ?? "—"}</td>
                <td className="px-4 py-3 text-right">{c.open_count}</td>
                <td className="px-4 py-3 text-right">{c.matter_count}</td>
                <td className="px-4 py-3 text-slate">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
