"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import type { SlotDay } from "@/lib/scheduling";

export default function MeetingPicker({
  matterId,
  slotDays,
  timeLabels,
  action,
  purposeOptions,
  submitLabel = "Book meeting",
}: {
  matterId: number;
  slotDays: SlotDay[];
  timeLabels: Record<string, string>;
  action: (formData: FormData) => void | Promise<void>;
  purposeOptions: string[];
  submitLabel?: string;
}) {
  const [day, setDay] = useState(slotDays[0]?.dayKey ?? "");
  const [slot, setSlot] = useState("");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="matter_id" value={matterId} />
      <input type="hidden" name="slot" value={slot} />
      <div>
        <label className="label" htmlFor={`purpose-${matterId}`}>Purpose</label>
        <select id={`purpose-${matterId}`} name="purpose" className="field">
          {purposeOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {slotDays.map((d) => (
          <button key={d.dayKey} type="button" onClick={() => setDay(d.dayKey)} className={`rounded-lg border px-3 py-1.5 text-xs ${day === d.dayKey ? "border-brand-black bg-brand-black text-white" : "border-stone bg-paper text-slate hover:border-gold"}`}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {slotDays.find((d) => d.dayKey === day)?.slots.map((s) => (
          <button key={s.iso} type="button" onClick={() => setSlot(slot === s.iso ? "" : s.iso)} className={`rounded-lg border px-2 py-1.5 text-xs ${slot === s.iso ? "border-gold bg-gold text-brand-black" : "border-stone bg-paper text-ink hover:border-gold"}`}>
            {timeLabels[s.iso]}
          </button>
        ))}
      </div>
      <SubmitButton className="btn-dark btn-sm" disabled={!slot} pendingText="Booking…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
