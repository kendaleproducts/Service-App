"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import FlameMark from "@/components/FlameMark";
import { logout } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/service-requests", label: "Service Requests" },
  { href: "/locations", label: "Locations" },
  { href: "/service-companies", label: "Service Companies" },
  { href: "/parts", label: "Parts Inventory" },
  { href: "/shipments", label: "Shipments" },
  { href: "/reports", label: "Reports" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading font-medium text-white">
      <FlameMark className="h-7 w-auto shrink-0" />
      <span>
        Service Tracker
        <span className="block text-[10px] font-sans font-normal tracking-wide text-white/50 -mt-0.5">
          KENDALE PRODUCTS LTD
        </span>
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-hotsauce text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const signOutForm = (
    <form action={logout} className="px-3 py-4 border-t border-white/10">
      <button
        type="submit"
        className="w-full text-left text-sm text-white/60 hover:text-hotsauce transition-colors"
      >
        Sign out
      </button>
    </form>
  );

  return (
    <>
      {/* Mobile/tablet top bar */}
      <div className="no-print lg:hidden bg-charcoal">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandMark />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-white p-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="h-1 bg-gradient-to-r from-hotsauce to-hickory" />
      </div>

      {/* Mobile/tablet drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-charcoal flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <BrandMark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-white p-1 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            {navLinks(() => setOpen(false))}
            {signOutForm}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-charcoal min-h-screen sticky top-0">
        <div className="px-4 py-4 border-b border-white/10">
          <BrandMark />
        </div>
        {navLinks()}
        {signOutForm}
      </aside>
    </>
  );
}
