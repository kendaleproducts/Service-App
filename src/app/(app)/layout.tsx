import Link from "next/link";
import { logout } from "@/app/login/actions";
import FlameMark from "@/components/FlameMark";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/service-requests", label: "Service Requests" },
  { href: "/locations", label: "Locations" },
  { href: "/service-companies", label: "Service Companies" },
  { href: "/parts", label: "Parts Inventory" },
  { href: "/shipments", label: "Shipments" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-charcoal">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-heading font-medium text-white">
              <FlameMark className="h-7 w-auto shrink-0" />
              <span>
                Service Tracker
                <span className="block text-[10px] font-sans font-normal tracking-wide text-white/50 -mt-0.5">
                  KENDALE PRODUCTS LTD
                </span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-white/70">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-hotsauce transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-white/60 hover:text-hotsauce transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav className="md:hidden flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 text-sm text-white/70">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-hotsauce">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="h-1 bg-gradient-to-r from-hotsauce to-hickory" />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
