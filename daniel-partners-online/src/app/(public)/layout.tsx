import { getCurrentUser } from "@/lib/session";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedInAs={user ? { name: user.name, role: user.role } : null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
