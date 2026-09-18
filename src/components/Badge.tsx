const COLOR_MAP: Record<string, string> = {
  // service request statuses
  New: "bg-stone-200 text-charcoal",
  Scheduled: "bg-spice text-hickory",
  "In Progress": "bg-hotsauce/15 text-hickory",
  "Awaiting Parts": "bg-hotsauce text-white",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-stone-200 text-stone-600",
  // priorities
  Low: "bg-stone-100 text-stone-600",
  Normal: "bg-stone-100 text-stone-700",
  High: "bg-hotsauce/15 text-hickory",
  Urgent: "bg-hickory text-white",
  // location statuses
  Open: "bg-green-100 text-green-800",
  Pending: "bg-spice text-hickory",
  Archived: "bg-stone-200 text-stone-600",
  // shipment statuses
  Preparing: "bg-stone-100 text-stone-700",
  Shipped: "bg-hotsauce/15 text-hickory",
  Delivered: "bg-green-100 text-green-800",
};

export default function Badge({ label }: { label: string }) {
  const classes = COLOR_MAP[label] ?? "bg-stone-100 text-stone-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
