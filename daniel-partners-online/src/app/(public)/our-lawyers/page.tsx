import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import Avatar from "@/components/Avatar";
import { firm } from "@/lib/brand";
import { listLawyers } from "@/lib/data";

export const metadata: Metadata = { title: "Our Lawyers" };

export default function LawyersPage() {
  const lawyers = listLawyers();
  return (
    <>
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Our lawyers" tone="light" title="Your dedicated team of professionals" lede={`Online matters are handled by the lawyers of ${firm.name}. Full profiles are on ${firm.siteLabel}.`} />
        </div>
      </section>
      <section className="bg-ivory">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-16 md:grid-cols-2">
          {lawyers.map((l) => (
            <article key={l.id} className="card flex gap-5 p-6">
              <Avatar initials={l.initials} size="lg" />
              <div>
                <h2 className="text-xl normal-case tracking-normal text-brand-black">{l.name}</h2>
                <p className="text-xs uppercase tracking-[0.18em] text-gold-deep">{l.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate">{l.bio}</p>
                <p className="mt-3 text-xs text-mist">{l.practice_areas.filter((a) => a !== "Everyday Legal").join(" · ")}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
