"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import type { IntakeQuestion } from "@/lib/types";
import type { SlotDay } from "@/lib/scheduling";
import { submitIntake, type IntakeState } from "./actions";

type Props = {
  service: { slug: string; name: string; fee_label: string; fee_display: string; consultation_minutes: number; questions: IntakeQuestion[] };
  lawyerName: string | null;
  slotDays: SlotDay[];
  signedIn: { name: string; email: string } | null;
  timeLabels: Record<string, string>;
};

const STEPS = ["About you", "Your matter", "Conflict check", "Video meeting", "Review"];

export default function IntakeForm({ service, lawyerName, slotDays, signedIn, timeLabels }: Props) {
  const [state, action] = useActionState<IntakeState, FormData>(submitIntake, null);
  const [step, setStep] = useState(0);
  const [selectedDay, setSelectedDay] = useState(slotDays[0]?.dayKey ?? "");
  const [slot, setSlot] = useState("");
  const errors = state?.fieldErrors ?? {};

  const err = (key: string) => (errors[key] ? <p className="mt-1 text-xs text-red">{errors[key]}</p> : null);
  const show = (i: number) => (step === i ? "" : "hidden");

  return (
    <form action={action} className="card p-6 sm:p-8">
      <input type="hidden" name="service_slug" value={service.slug} />

      <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-display ${
                i === step ? "bg-brand-black text-white" : i < step ? "bg-gold text-brand-black" : "bg-stone text-slate"
              }`}
            >
              {i + 1}
            </button>
            <span className={`text-xs uppercase tracking-[0.14em] ${i === step ? "text-brand-black" : "text-mist"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {state?.error && (
        <div className="mb-6 rounded-lg border border-red/30 bg-red-soft px-4 py-3 text-sm text-red">
          {state.error}{" "}
          {Object.keys(errors).length > 0 && (
            <button type="button" className="underline" onClick={() => setStep(firstErrorStep(errors, service.questions))}>
              Go to the first problem
            </button>
          )}
        </div>
      )}

      {/* Step 1 */}
      <section className={show(0)}>
        <h2 className="text-2xl normal-case tracking-normal text-brand-black">About you</h2>
        {signedIn ? (
          <p className="mt-4 rounded-lg bg-ivory px-4 py-3 text-sm text-slate">
            Signed in as <strong className="text-brand-black">{signedIn.name}</strong> ({signedIn.email}). This matter will be added to your portal.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">Full legal name</label>
              <input id="name" name="name" className="field" autoComplete="name" />
              {err("name")}
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="field" autoComplete="email" />
              {err("email")}
              {errors.email?.includes("Sign in") && (
                <Link href={`/sign-in?next=/start/${service.slug}`} className="mt-1 inline-block text-xs text-gold-deep underline">
                  Sign in
                </Link>
              )}
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" className="field" autoComplete="tel" />
              {err("phone")}
            </div>
            <div>
              <label className="label" htmlFor="city">City or town</label>
              <input id="city" name="city" className="field" autoComplete="address-level2" />
              {err("city")}
            </div>
            <div>
              <label className="label" htmlFor="password">Create a portal password</label>
              <input id="password" name="password" type="password" className="field" autoComplete="new-password" />
              {err("password")}
            </div>
            <label className="flex items-start gap-3 text-sm text-slate sm:col-span-2">
              <input type="checkbox" name="in_ontario" value="yes" className="mt-1 accent-gold" />
              <span>I live in Ontario, or the matter concerns Ontario property or Ontario law.</span>
            </label>
            {err("in_ontario")}
          </div>
        )}
      </section>

      {/* Step 2 */}
      <section className={show(1)}>
        <h2 className="text-2xl normal-case tracking-normal text-brand-black">Your matter</h2>
        <p className="mt-2 text-sm text-slate">A few questions so your lawyer can prepare. Short answers are fine.</p>
        <div className="mt-6 space-y-5">
          {service.questions.map((q) => (
            <div key={q.key}>
              <label className="label" htmlFor={`q_${q.key}`}>
                {q.label}
                {q.required === false && <span className="ml-1 normal-case tracking-normal text-mist">(optional)</span>}
              </label>
              <QuestionInput q={q} />
              {q.help && <p className="mt-1 text-xs text-mist">{q.help}</p>}
              {err(`q_${q.key}`)}
            </div>
          ))}
        </div>
      </section>

      {/* Step 3 */}
      <section className={show(2)}>
        <h2 className="text-2xl normal-case tracking-normal text-brand-black">Conflict check</h2>
        <p className="mt-2 text-sm text-slate">
          Lawyers must confirm they do not already act for someone whose interests conflict with yours. List the other people or companies involved in this matter, if any.
        </p>
        <div className="mt-6">
          <label className="label" htmlFor="other_parties">Other parties (names)</label>
          <textarea id="other_parties" name="other_parties" rows={3} className="field" placeholder="e.g. the seller, your employer, a business partner, a spouse" />
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm text-slate">
          <input type="checkbox" name="conflict_confirm" value="yes" className="mt-1 accent-gold" />
          <span>I have listed everyone I know to be involved, and I understand the firm will confirm it is able to act before the consultation.</span>
        </label>
        {err("conflict_confirm")}
      </section>

      {/* Step 4 */}
      <section className={show(3)}>
        <h2 className="text-2xl normal-case tracking-normal text-brand-black">Video meeting</h2>
        <p className="mt-2 text-sm text-slate">
          Choose a time for your {service.consultation_minutes}-minute video consultation{lawyerName ? ` with ${lawyerName}` : ""}. Times are Eastern (Toronto). You can also skip this and book from your portal.
        </p>
        <input type="hidden" name="slot" value={slot} />
        <div className="mt-6 flex flex-wrap gap-2">
          {slotDays.map((d) => (
            <button
              key={d.dayKey}
              type="button"
              onClick={() => setSelectedDay(d.dayKey)}
              className={`rounded-lg border px-3 py-2 text-xs ${selectedDay === d.dayKey ? "border-brand-black bg-brand-black text-white" : "border-stone bg-paper text-slate hover:border-gold"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slotDays
            .find((d) => d.dayKey === selectedDay)
            ?.slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                onClick={() => setSlot(slot === s.iso ? "" : s.iso)}
                className={`rounded-lg border px-2 py-2 text-sm ${slot === s.iso ? "border-gold bg-gold text-brand-black" : "border-stone bg-paper text-ink hover:border-gold"}`}
              >
                {timeLabels[s.iso]}
              </button>
            ))}
        </div>
        {err("slot")}
        {slot && (
          <p className="mt-4 text-sm text-slate">
            Selected: <strong className="text-brand-black">{slotDays.find((d) => d.slots.some((s) => s.iso === slot))?.label}, {timeLabels[slot]}</strong>
          </p>
        )}
      </section>

      {/* Step 5 */}
      <section className={show(4)}>
        <h2 className="text-2xl normal-case tracking-normal text-brand-black">Review and submit</h2>
        <dl className="mt-6 divide-y divide-stone rounded-lg border border-stone text-sm">
          <Row k="Service" v={service.name} />
          <Row k="Fee" v={`${service.fee_label} ${service.fee_display} + HST`} />
          <Row k="Lawyer" v={lawyerName ?? "Assigned after intake"} />
          <Row k="Video meeting" v={slot ? `${slotDays.find((d) => d.slots.some((s) => s.iso === slot))?.label}, ${timeLabels[slot]}` : "Not booked yet"} />
        </dl>
        <div className="mt-6 rounded-lg bg-ivory p-4 text-sm leading-relaxed text-slate">
          Submitting this form does not create a lawyer-client relationship or any obligation to pay. The firm will complete a conflict check and confirm it can act. Fees become payable only after you sign an engagement letter in your portal.
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm text-slate">
          <input type="checkbox" name="agree" value="yes" className="mt-1 accent-gold" />
          <span>I have read this notice.</span>
        </label>
        {err("agree")}
      </section>

      <div className="mt-10 flex items-center justify-between border-t border-stone pt-6">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={`btn-ghost ${step === 0 ? "invisible" : ""}`}>
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="btn-dark">
            Continue →
          </button>
        ) : (
          <SubmitButton className="btn-gold" pendingText="Submitting…">
            Submit intake
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-mist">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

function QuestionInput({ q }: { q: IntakeQuestion }) {
  const id = `q_${q.key}`;
  switch (q.type) {
    case "textarea":
      return <textarea id={id} name={id} rows={3} className="field" />;
    case "select":
      return (
        <select id={id} name={id} className="field" defaultValue="">
          <option value="" disabled>Select…</option>
          {q.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case "yesno":
      return (
        <div className="flex gap-4 pt-1">
          {["Yes", "No"].map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name={id} value={o} className="accent-gold" /> {o}
            </label>
          ))}
        </div>
      );
    case "radio":
      return (
        <div className="flex flex-wrap gap-4 pt-1">
          {q.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name={id} value={o} className="accent-gold" /> {o}
            </label>
          ))}
        </div>
      );
    case "date":
      return <input id={id} name={id} type="date" className="field" />;
    case "number":
      return <input id={id} name={id} type="number" inputMode="decimal" className="field" />;
    default:
      return <input id={id} name={id} type="text" className="field" />;
  }
}

function firstErrorStep(errors: Record<string, string>, questions: IntakeQuestion[]): number {
  const keys = Object.keys(errors);
  if (keys.some((k) => ["name", "email", "phone", "city", "password", "in_ontario"].includes(k))) return 0;
  if (keys.some((k) => questions.some((q) => `q_${q.key}` === k))) return 1;
  if (keys.includes("conflict_confirm")) return 2;
  if (keys.includes("slot")) return 3;
  return 4;
}
