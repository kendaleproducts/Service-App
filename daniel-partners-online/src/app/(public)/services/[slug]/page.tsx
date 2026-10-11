import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getServiceBySlug, listLawyers } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  return { title: service ? service.name : "Service" };
}

export default async function ServiceDetailPage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service || !service.active) notFound();
  const lawyers = listLawyers().filter((l) => l.practice_areas.includes(service.practice_area));

  return (
    <>
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Link href="/services" className="text-xs uppercase tracking-[0.18em] text-white/60 hover:text-gold">
            ← All services
          </Link>
          <p className="eyebrow mt-6">{service.category}</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">{service.name}</h1>
          <p className="lede mt-6 max-w-2xl text-white/80">{service.summary}</p>
        </div>
      </section>
      <section className="bg-ivory">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl text-brand-black">About this service</h2>
              <div className="rule-gold mt-4" />
              <p className="mt-5 leading-relaxed text-slate">{service.description}</p>
            </div>
            <div>
              <h2 className="text-2xl text-brand-black">What is included</h2>
              <div className="rule-gold mt-4" />
              <ul className="mt-5 space-y-3">
                {service.includes.map((i) => (
                  <li key={i} className="flex gap-3 text-slate">
                    <span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-gold/20 text-center text-[10px] leading-4 text-gold-deep">✓</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl text-brand-black">Who handles it</h2>
              <div className="rule-gold mt-4" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {lawyers.map((l) => (
                  <div key={l.id} className="card flex items-center gap-3 p-4">
                    <Avatar initials={l.initials} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-brand-black">{l.name}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-gold-deep">{l.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="card-dark p-6">
              <p className="text-[11px] font-display uppercase tracking-[0.18em] text-white/60">{service.fee_label}</p>
              <p className="font-serif text-5xl">{formatMoney(service.fee_cents)}</p>
              {service.fee_note && <p className="mt-1 text-sm text-white/70">{service.fee_note}</p>}
              <p className="mt-1 text-xs text-white/45">Plus HST{service.fee_note?.includes("disbursements") ? "" : " and any disbursements"}.</p>
              <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Timeline</dt>
                  <dd className="text-right">{service.timeline}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">First meeting</dt>
                  <dd className="text-right">{service.consultation_minutes} min video</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/60">Available to</dt>
                  <dd className="text-right">Ontario residents</dd>
                </div>
              </dl>
              <Link href={`/start/${service.slug}`} className="btn-gold mt-6 w-full">
                Start this matter
              </Link>
              <p className="mt-3 text-center text-xs text-white/50">About 10 minutes. No payment until you have met your lawyer.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
