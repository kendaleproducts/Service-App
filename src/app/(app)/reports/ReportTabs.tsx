import Link from "next/link";

const TABS = [
  { key: "requests", href: "/reports", label: "Service Requests" },
  { key: "fleet", href: "/reports/fleet", label: "Fleet" },
];

export default function ReportTabs({ active }: { active: "requests" | "fleet" }) {
  return (
    <div className="no-print flex gap-1 border-b border-stone-200">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
            tab.key === active
              ? "border-hotsauce text-charcoal"
              : "border-transparent text-stone-500 hover:text-charcoal"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
