import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import Avatar from "@/components/Avatar";
import { firm } from "@/lib/brand";
import { listLawyers, listServices } from "@/lib/data";
import { formatMoney } from "@/lib/format";

const steps = [
  { n: "01", title: "Choose a service", body: "Every service has a flat or from-fee, what is included, and a realistic timeline. No surprises." },
  { n: "02", title: "Tell us about your matter", body: "A short online questionnaire and a conflict check. It takes about ten minutes." },
  { n: "03", title: "Meet your lawyer on video", body: "Pick a time that suits you. You meet a Daniel & Partners lawyer, not a call centre." },
  { n: "04", title: "Sign, pay and track online", body: "Engagement letter, retainer, drafts, messages and final documents all live in your secure portal." },
];

export default function HomePage() {
  const services = listServices();
  const featured = services.filter((s) => ["will-and-poa-bundle", "residential-purchase", "incorporation", "employment-contract-review", "virtual-notary", "consultation"].includes(s.slug));
  const lawyers = listLawyers();

  return (
    <>
      {/* Hero — dark, as on niagaralaw.ca */}
      <section className="relative overflow-hidden bg-brand-black text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,150,62,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_100%] opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:pt-28">
          <p className="eyebrow mb-6">The same firm. A new way to work with us.</p>
          <h1 className="max-w-4xl text-4xl sm:text-6xl">{firm.headline}</h1>
          <p className="mt-8 max-w-2xl font-display text-lg font-light tracking-[0.12em] text-white/85 sm:text-xl">
            {firm.subheadline} Now online.
          </p>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed tracking-[0.02em] text-white/70">
            {firm.productName} brings the lawyers of {firm.name} to you by secure video, with transparent flat fees and a client portal that keeps every document, message and meeting in one place. The same quality of work the firm has delivered since {firm.foundedYear}, at a lower cost than a traditional retainer.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/services" className="btn-outline-white">
              Need a Lawyer
            </Link>
            <Link href="/start/consultation" className="btn-white">
              Book a Consult
            </Link>
          </div>
        </div>
      </section>

      {/* Why online */}
      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            eyebrow="Why online"
            tone="light"
            title="The experience you expect, without the overhead"
            lede="Our online service is built for matters that can be handled well by video and secure document exchange. You deal with the same lawyers; you simply do not pay for the boardroom."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              { k: "Transparent fees", v: "Flat or from-fees published up front, with everything that is included spelled out." },
              { k: "Real lawyers", v: `Every matter is handled by a ${firm.shortName} lawyer licensed by the ${firm.regulator}.` },
              { k: "Your portal", v: "Video meetings, e-signature, document requests and messages, all in one secure place." },
            ].map((item) => (
              <div key={item.k} className="bg-charcoal p-8">
                <h3 className="text-base uppercase tracking-[0.18em] text-gold">{item.k}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-white/75">{item.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Services & fees" title="What we can do for you online" />
            <Link href="/services" className="btn-outline shrink-0">
              All services
            </Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`} className="card group flex flex-col p-6 transition-colors hover:border-gold">
                <p className="eyebrow">{s.category}</p>
                <h3 className="mt-2 text-xl text-brand-black">{s.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">{s.summary}</p>
                <div className="mt-5 flex items-baseline justify-between border-t border-stone pt-4">
                  <span className="text-[11px] font-display uppercase tracking-[0.18em] text-slate">{s.fee_label}</span>
                  <span className="font-serif text-2xl text-brand-black">{formatMoney(s.fee_cents)}</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs text-mist">Fees exclude HST and disbursements. Sandbox: fees are illustrative until confirmed by the partners.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading eyebrow="How it works" title="Four steps, start to finish" align="center" />
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n}>
                <span className="font-serif text-4xl text-gold">{s.n}</span>
                <h3 className="mt-2 text-lg text-brand-black">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Link href="/how-it-works" className="btn-ghost">
              More about the process →
            </Link>
          </div>
        </div>
      </section>

      {/* Lawyers */}
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading eyebrow="Our lawyers" tone="light" title="You still get us" lede={`Online matters are handled by the same lawyers who practise from our ${firm.address.city} office.`} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lawyers.map((l) => (
              <div key={l.id} className="card-dark flex items-start gap-4 p-5">
                <Avatar initials={l.initials} tone="gold" />
                <div>
                  <p className="font-display text-sm tracking-[0.08em]">{l.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-gold">{l.title}</p>
                  <p className="mt-2 text-xs text-white/60">{l.practice_areas.filter((a) => a !== "Everyday Legal").join(" · ")}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/our-lawyers" className="btn-outline-white">
              Meet the team
            </Link>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl text-brand-black">{firm.tagline}</h2>
          <div className="rule-gold mx-auto mt-6" />
          <p className="lede mt-6 text-slate">
            Experience, dedication and integrity have defined {firm.shortName} for more than a century. Our goal is unchanged online: to achieve your goals efficiently, without unnecessary cost or delay.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/services" className="btn-dark">
              Browse services
            </Link>
            <Link href="/start/consultation" className="btn-gold">
              Book a consult
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
