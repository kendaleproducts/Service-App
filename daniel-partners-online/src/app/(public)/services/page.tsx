import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { listServices } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Services & Fees" };

export default function ServicesPage() {
  const services = listServices();
  const categories = [...new Set(services.map((s) => s.category))];
  return (
    <>
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Services & fees" tone="light" title="Clear scope. Clear price." lede="Each service lists exactly what is included and what it costs. If your matter needs more than the listed scope, your lawyer will tell you before any additional work begins." />
        </div>
      </section>
      <section className="bg-ivory">
        <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-2xl text-brand-black">{cat}</h2>
              <div className="rule-gold mt-4" />
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {services
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <Link key={s.id} href={`/services/${s.slug}`} className="card group flex flex-col p-6 transition-colors hover:border-gold sm:flex-row sm:gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl text-brand-black group-hover:text-gold-deep">{s.name}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate">{s.summary}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mist">Typical timeline · {s.timeline}</p>
                      </div>
                      <div className="mt-5 shrink-0 border-t border-stone pt-4 sm:mt-0 sm:w-36 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:text-right">
                        <p className="text-[11px] font-display uppercase tracking-[0.18em] text-slate">{s.fee_label}</p>
                        <p className="font-serif text-3xl text-brand-black">{formatMoney(s.fee_cents)}</p>
                        {s.fee_note && <p className="mt-1 text-xs text-mist">{s.fee_note}</p>}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-mist">All fees exclude HST and disbursements. Sandbox: fees are illustrative until confirmed by the partners.</p>
        </div>
      </section>
    </>
  );
}
