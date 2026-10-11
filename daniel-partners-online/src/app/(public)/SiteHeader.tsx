"use client";

import Link from "next/link";
import { useState } from "react";
import BrandMark from "@/components/BrandMark";
import { firm } from "@/lib/brand";

const nav = [
  { href: "/services", label: "Services & Fees" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/our-lawyers", label: "Our Lawyers" },
];

export default function SiteHeader({ signedInAs }: { signedInAs: { name: string; role: "client" | "staff" } | null }) {
  const [open, setOpen] = useState(false);
  const portalHref = signedInAs?.role === "staff" ? "/firm" : "/portal";
  return (
    <header className="bg-brand-black text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-[11px] tracking-[0.12em] text-white/60">
          <a href={firm.siteUrl} className="hover:text-gold transition-colors">
            ← {firm.siteLabel} · main site
          </a>
          <span className="hidden sm:inline">
            {firm.phone} · {firm.tollFree}
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" aria-label="Home">
          <BrandMark tone="light" size="md" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="font-display text-[12px] uppercase tracking-[0.22em] text-white/85 hover:text-gold transition-colors">
              {n.label}
            </Link>
          ))}
          {signedInAs ? (
            <Link href={portalHref} className="btn-outline-white btn-sm">
              {signedInAs.role === "staff" ? "Firm desk" : "My portal"}
            </Link>
          ) : (
            <Link href="/sign-in" className="btn-outline-white btn-sm">
              Client sign in
            </Link>
          )}
        </nav>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 flex-col items-end justify-center gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-7 bg-white" />
          <span className="h-0.5 w-7 bg-gold" />
          <span className="h-0.5 w-7 bg-white" />
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/10 px-4 pb-6 pt-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-3 font-display text-[13px] uppercase tracking-[0.22em] text-white/90">
              {n.label}
            </Link>
          ))}
          <Link href={signedInAs ? portalHref : "/sign-in"} onClick={() => setOpen(false)} className="btn-outline-white mt-3 w-full">
            {signedInAs ? (signedInAs.role === "staff" ? "Firm desk" : "My portal") : "Client sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
