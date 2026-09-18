const COLOR_MAP: Record<string, string> = {
  // service request statuses
  New: "bg-blue-100 text-blue-800",
  Scheduled: "bg-amber-100 text-amber-800",
  "In Progress": "bg-indigo-100 text-indigo-800",
  "Awaiting Parts": "bg-orange-100 text-orange-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-slate-200 text-slate-600",
  // priorities
  Low: "bg-slate-100 text-slate-600",
  Normal: "bg-slate-100 text-slate-700",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-red-100 text-red-800",
  // location statuses
  Open: "bg-green-100 text-green-800",
  Pending: "bg-amber-100 text-amber-800",
  Archived: "bg-slate-200 text-slate-600",
  // shipment statuses
  Preparing: "bg-slate-100 text-slate-700",
  Shipped: "bg-indigo-100 text-indigo-800",
  Delivered: "bg-green-100 text-green-800",
};

export default function Badge({ label }: { label: string }) {
  const classes = COLOR_MAP[label] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
