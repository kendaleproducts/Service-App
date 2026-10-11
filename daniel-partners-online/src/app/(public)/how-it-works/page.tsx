import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { firm } from "@/lib/brand";

export const metadata: Metadata = { title: "How It Works" };

const stages = [
  { title: "Choose a service and tell us about it", body: "Pick the service that fits. The questionnaire asks only what your lawyer needs to prepare for the first meeting, and we ask for the names of anyone else involved so we can run a conflict check before you meet." },
  { title: "Book your video consultation", body: "Choose a time in the next two weeks. We assign a lawyer in the right practice area and confirm the meeting by email. The meeting runs on a secure video link from your portal." },
  { title: "Engagement letter and retainer", body: "After the meeting your lawyer sends an engagement letter that restates the scope and the fee. You sign it electronically and pay the retainer online. Funds are held in trust until work is done." },
  { title: "We do the work; you watch it progress", body: "Your portal shows the status of the matter, requests for documents, drafts for your review and messages from your lawyer. You reply, approve or comment from any device." },
  { title: "Signing and delivery", body: "Where Ontario law allows remote witnessing and commissioning, we sign on video. Where an original or an in-person step is required, we tell you up front and arrange it. Final documents stay in your portal." },
];

const faqs = [
  { q: "Is this the same firm?", a: `Yes. ${firm.productName} is operated by ${firm.name}, the same lawyers, the same professional obligations and the same insurance. The online service is simply a different way to deliver matters that suit it.` },
  { q: "Why is it less expensive?", a: "Flat fees, a structured intake, video meetings and a portal that removes paper handling and phone tag. The savings come from process, not from reduced lawyer involvement." },
  { q: "Can a will really be signed remotely?", a: "Ontario permits wills and powers of attorney to be witnessed through audio-visual communication technology when a licensee is one of the witnesses, with specific requirements we manage for you." },
  { q: "What if my matter turns out to be more complex?", a: "Your lawyer will say so at the consultation and before any additional work starts. You can continue with the firm on a traditional retainer or stop with no further obligation." },
  { q: "Who can use the online service?", a: "Clients who are in Ontario. Some real estate steps require you to be in Ontario at signing." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="How it works" tone="light" title="From first click to final document" lede="The process is designed so you always know where your matter stands, what we need from you and what it will cost." />
        </div>
      </section>
      <section className="bg-ivory">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <ol className="space-y-10">
            {stages.map((s, i) => (
              <li key={s.title} className="grid gap-4 sm:grid-cols-[72px_1fr]">
                <span className="font-serif text-5xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-xl text-brand-black">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionHeading eyebrow="Questions" title="Common questions" />
          <dl className="mt-10 divide-y divide-stone">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-display text-base tracking-[0.04em] text-brand-black">{f.q}</dt>
                <dd className="mt-2 leading-relaxed text-slate">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <Link href="/services" className="btn-dark">
              See services &amp; fees
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
