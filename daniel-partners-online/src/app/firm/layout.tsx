import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { requireUser } from "@/lib/session";
import { signOut } from "@/app/sign-in/actions";

const nav = [
  { href: "/firm", label: "Dashboard" },
  { href: "/firm/matters", label: "Matters" },
  { href: "/firm/clients", label: "Clients" },
  { href: "/firm/calendar", label: "Calendar" },
];

export default async function FirmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("staff");
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="bg-brand-black text-white lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/firm" aria-label="Firm desk">
            <BrandMark tone="light" size="sm" />
          </Link>
          <p className="mt-0 text-[10px] uppercase tracking-[0.3em] text-gold lg:mt-4">Firm desk</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 font-display text-[12px] uppercase tracking-[0.18em] text-white/80 hover:bg-white/5 hover:text-gold">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 px-5 py-5 text-xs text-white/60 lg:mt-6 lg:block">
          <p className="text-white">{user.name}</p>
          <p>{user.lawyer_id ? "Lawyer" : "Staff"}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="uppercase tracking-[0.16em] text-gold hover:underline">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-gradient-to-r from-gold to-gold/0" />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
