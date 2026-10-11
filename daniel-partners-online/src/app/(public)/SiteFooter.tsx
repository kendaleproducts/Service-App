import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { firm } from "@/lib/brand";

export default function SiteFooter() {
  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <BrandMark tone="light" size="sm" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            {firm.tagline}. {firm.productName} is the firm&apos;s online service: the same lawyers, delivered by secure video and a client portal at a lower cost.
          </p>
        </div>
        <div className="text-sm text-white/75">
          <p className="eyebrow mb-3">Office</p>
          <p>{firm.name}</p>
          <p>{firm.address.line1}</p>
          <p>
            {firm.address.city}, {firm.address.province} {firm.address.postalCode}
          </p>
          <p className="mt-3">
            <a href={`tel:${firm.phone}`} className="hover:text-gold">
              {firm.phone}
            </a>
            {" · "}
            <a href={`tel:${firm.tollFree}`} className="hover:text-gold">
              {firm.tollFree}
            </a>
          </p>
          <p className="mt-3">
            <a href={firm.siteUrl} className="text-gold hover:underline">
              {firm.siteLabel}
            </a>
          </p>
        </div>
        <div className="text-sm text-white/75">
          <p className="eyebrow mb-3">Online</p>
          <ul className="space-y-2">
            <li><Link href="/services" className="hover:text-gold">Services &amp; Fees</Link></li>
            <li><Link href="/how-it-works" className="hover:text-gold">How It Works</Link></li>
            <li><Link href="/our-lawyers" className="hover:text-gold">Our Lawyers</Link></li>
            <li><Link href="/sign-in" className="hover:text-gold">Client sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-[11px] leading-relaxed tracking-[0.06em] text-white/45">
          <p>
            © {new Date().getFullYear()} {firm.name}. Lawyers licensed by the {firm.regulator}. Online services are available to clients in Ontario. Fees shown exclude HST and disbursements. Nothing on this site is legal advice until we have confirmed a retainer with you.
          </p>
          <p className="mt-2 text-gold/80">Sandbox environment — demonstration data only.</p>
        </div>
      </div>
    </footer>
  );
}
