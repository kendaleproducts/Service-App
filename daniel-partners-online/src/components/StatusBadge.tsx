import { MATTER_STATUS_LABEL, type MatterStatus } from "@/lib/types";

const tone: Record<MatterStatus, string> = {
  intake_received: "bg-amber-soft text-amber",
  consultation_scheduled: "bg-gold-soft text-gold-deep",
  engagement_pending: "bg-amber-soft text-amber",
  in_progress: "bg-brand-black text-white",
  client_review: "bg-gold text-brand-black",
  completed: "bg-green-soft text-green",
  closed: "bg-stone text-slate",
  cancelled: "bg-red-soft text-red",
};

export default function StatusBadge({ status, audience = "client" }: { status: MatterStatus; audience?: "client" | "firm" }) {
  const label = audience === "firm" && status === "client_review" ? "Awaiting client review" : MATTER_STATUS_LABEL[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.16em] ${tone[status]}`}>
      {label}
    </span>
  );
}
