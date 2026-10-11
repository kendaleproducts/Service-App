import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { firm } from "@/lib/brand";
import { requireUser } from "@/lib/session";
import { signOut } from "@/app/sign-in/actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("client");
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-brand-black text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/portal" aria-label="Portal home">
            <BrandMark tone="light" size="sm" />
          </Link>
          <nav className="flex items-center gap-5 text-[11px] font-display uppercase tracking-[0.2em]">
            <Link href="/portal" className="hover:text-gold">Dashboard</Link>
            <Link href="/services" className="hidden sm:inline hover:text-gold">New matter</Link>
            <Link href="/portal/account" className="hover:text-gold">Account</Link>
            <form action={signOut}>
              <button type="submit" className="text-white/60 hover:text-gold">Sign out</button>
            </form>
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-stone px-4 py-5 text-center text-[11px] tracking-[0.06em] text-mist">
        {firm.name} · {firm.phone} · Secure client portal · Sandbox environment
        <span className="sr-only">Signed in as {user.name}</span>
      </footer>
    </div>
  );
}
