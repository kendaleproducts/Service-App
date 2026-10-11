import { MATTER_STATUS_LABEL, MATTER_STATUS_ORDER, type MatterStatus } from "@/lib/types";

export default function Stepper({ status }: { status: MatterStatus }) {
  const idx = MATTER_STATUS_ORDER.indexOf(status === "closed" ? "completed" : status);
  if (status === "cancelled") return null;
  return (
    <ol className="grid grid-cols-3 gap-y-4 sm:grid-cols-6 sm:gap-y-0">
      {MATTER_STATUS_ORDER.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <li key={s} className="flex flex-col items-start sm:items-center text-left sm:text-center">
            <div className="flex w-full items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-display ${
                  done ? "border-gold bg-gold text-brand-black" : current ? "border-brand-black bg-brand-black text-white" : "border-stone bg-paper text-mist"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < MATTER_STATUS_ORDER.length - 1 && (
                <span className={`hidden sm:block h-px flex-1 ${done ? "bg-gold" : "bg-stone"}`} />
              )}
            </div>
            <span className={`mt-2 pr-2 text-[11px] leading-tight ${current ? "text-brand-black font-semibold" : done ? "text-slate" : "text-mist"}`}>
              {MATTER_STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
