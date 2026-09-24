import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full lg:flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="no-print hidden lg:block h-1 bg-gradient-to-r from-hotsauce to-hickory" />
        <main className="max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
