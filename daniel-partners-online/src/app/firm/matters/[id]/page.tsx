import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import Stepper from "@/components/Stepper";
import SubmitButton from "@/components/SubmitButton";
import {
  buildEngagementTerms,
  getMatterSummary,
  getService,
  listAppointments,
  listDocumentRequests,
  listDocuments,
  listEvents,
  listInvoices,
  listLawyers,
  listMessages,
  markMessagesRead,
  takenSlots,
} from "@/lib/data";
import { formatBytes, formatDate, formatDateTime, formatMoneyExact, formatRelative, formatTime } from "@/lib/format";
import { availableSlots } from "@/lib/scheduling";
import { requireUser } from "@/lib/session";
import { DOCUMENT_KIND_LABEL, MATTER_STATUS_LABEL, type MatterStatus } from "@/lib/types";
import MeetingPicker from "@/app/portal/matters/[id]/MeetingPicker";
import {
  addInternalNote,
  markConflictCleared,
  reassignLawyer,
  requestDocument,
  sendEngagementLetter,
  setMeetingStatus,
  staffBookMeeting,
  staffIssueInvoice,
  staffMarkPaid,
  staffMessage,
  staffUpload,
  updateStatus,
} from "../../actions";

const STATUSES: MatterStatus[] = ["intake_received", "consultation_scheduled", "engagement_pending", "in_progress", "client_review", "completed", "closed", "cancelled"];

export default async function FirmMatterPage({ params, searchParams }: PageProps<"/firm/matters/[id]">) {
  const user = await requireUser("staff");
  const { id } = await params;
  const sp = await searchParams;
  const matter = getMatterSummary(Number(id));
  if (!matter) notFound();
  const service = getService(matter.service_id)!;
  const lawyers = listLawyers();
  const messages = listMessages(matter.id);
  const documents = listDocuments(matter.id);
  const requests = listDocumentRequests(matter.id);
  const appointments = listAppointments(matter.id);
  const invoices = listInvoices(matter.id);
  const events = listEvents(matter.id, true);
  markMessagesRead(matter.id, "staff");

  const slotDays = availableSlots(takenSlots(matter.lawyer_id), 8, 30);
  const timeLabels: Record<string, string> = {};
  for (const d of slotDays) for (const s of d.slots) timeLabels[s.iso] = formatTime(s.iso);
  const draftTerms = matter.engagement_terms ?? buildEngagementTerms(matter, service, matter.lawyer_name);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/firm/matters" className="text-xs uppercase tracking-[0.18em] text-slate hover:text-gold-deep">← Matters</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-mist">{matter.reference} · {service.category} · opened {formatDate(matter.created_at)}</p>
            <h1 className="mt-1 text-3xl normal-case tracking-normal text-brand-black">{service.name}</h1>
            <p className="mt-1 text-sm text-slate">
              <Link href={`/firm/clients/${matter.client_id}`} className="font-semibold text-brand-black hover:text-gold-deep">{matter.client_name}</Link> · {matter.client_email}
            </p>
          </div>
          <StatusBadge status={matter.status} audience="firm" />
        </div>
      </div>

      <section className="card p-6">
        <Stepper status={matter.status} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Workflow controls */}
          <section className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Workflow</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <form action={markConflictCleared}>
                <input type="hidden" name="matter_id" value={matter.id} />
                <p className="label">Conflict check</p>
                {matter.conflict_cleared_at ? (
                  <p className="text-sm text-green">Cleared {formatDate(matter.conflict_cleared_at)}</p>
                ) : (
                  <SubmitButton className="btn-gold btn-sm w-full" pendingText="…">Mark cleared</SubmitButton>
                )}
                <p className="mt-1 text-xs text-mist">Other parties: {matter.other_parties || "none given"}</p>
              </form>
              <form action={reassignLawyer} className="flex flex-col gap-2">
                <input type="hidden" name="matter_id" value={matter.id} />
                <label className="label" htmlFor="lawyer_id">Responsible lawyer</label>
                <select id="lawyer_id" name="lawyer_id" className="field" key={matter.lawyer_id ?? "none"} defaultValue={matter.lawyer_id ?? ""}>
                  <option value="">Unassigned</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <SubmitButton className="btn-outline btn-sm" pendingText="…">Assign</SubmitButton>
              </form>
              <form action={updateStatus} className="flex flex-col gap-2">
                <input type="hidden" name="matter_id" value={matter.id} />
                <label className="label" htmlFor="status">Status</label>
                <select id="status" name="status" className="field" key={matter.status} defaultValue={matter.status}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s === "client_review" ? "Awaiting client review" : MATTER_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <SubmitButton className="btn-outline btn-sm" pendingText="…">Update</SubmitButton>
              </form>
            </div>
          </section>

          {/* Engagement */}
          <section className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Engagement letter</h2>
            {matter.engagement_signed_at ? (
              <p className="mt-3 text-sm text-green">Signed by {matter.engagement_signed_name} on {formatDateTime(matter.engagement_signed_at)}.</p>
            ) : matter.engagement_terms ? (
              <p className="mt-3 text-sm text-amber">Sent to client, awaiting signature.</p>
            ) : null}
            {!matter.engagement_signed_at && (
              <form action={sendEngagementLetter} className="mt-4 space-y-3">
                <input type="hidden" name="matter_id" value={matter.id} />
                <textarea name="terms" rows={8} defaultValue={draftTerms} className="field font-mono text-xs" />
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="label" htmlFor="fee_dollars">Retainer amount ($, before HST)</label>
                    <input id="fee_dollars" name="fee_dollars" type="number" step="0.01" defaultValue={(service.fee_cents / 100).toFixed(2)} className="field w-40" />
                  </div>
                  <label className="flex items-center gap-2 pb-2.5 text-sm text-slate">
                    <input type="checkbox" name="with_retainer" value="yes" defaultChecked={!invoices.some((i) => i.kind === "retainer")} className="accent-gold" /> Issue retainer request
                  </label>
                  <SubmitButton className="btn-dark btn-sm" pendingText="Sending…">{matter.engagement_terms ? "Re-send letter" : "Send engagement letter"}</SubmitButton>
                </div>
              </form>
            )}
          </section>

          {/* Messages */}
          <section className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Messages with client</h2>
            <div className="mt-4 space-y-4">
              {messages.length === 0 && <p className="text-sm text-mist">No messages yet.</p>}
              {messages.map((m) => {
                const fromClient = m.sender_role === "client";
                return (
                  <div key={m.id} className={`flex gap-3 ${fromClient ? "" : "flex-row-reverse"}`}>
                    <Avatar initials={m.sender_name.split(" ").map((p) => p[0]).slice(0, 2).join("")} size="sm" tone={fromClient ? "light" : "dark"} />
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${fromClient ? "bg-ivory text-ink" : "bg-brand-black text-white"}`}>
                      <p className={`text-[10px] uppercase tracking-[0.14em] ${fromClient ? "text-mist" : "text-gold"}`}>{m.sender_name} · {formatRelative(m.created_at)}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form action={staffMessage} className="mt-5 space-y-3">
              <input type="hidden" name="matter_id" value={matter.id} />
              <textarea name="body" rows={3} required className="field" placeholder="Message the client…" />
              <SubmitButton className="btn-dark btn-sm" pendingText="Sending…">Send to client</SubmitButton>
            </form>
          </section>

          {/* Documents */}
          <section className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Documents</h2>
            <ul className="mt-4 divide-y divide-stone">
              {documents.length === 0 && <li className="py-3 text-sm text-mist">No documents.</li>}
              {documents.map((d) => (
                <li key={d.id} className="py-3 text-sm">
                  <a href={`/api/documents/${d.id}`} className="font-semibold text-ink hover:text-gold-deep">{d.name}</a>
                  <p className="text-xs text-mist">
                    {DOCUMENT_KIND_LABEL[d.kind] ?? d.kind} · {d.uploaded_by_name} · {formatBytes(d.size_bytes)} · {formatDate(d.created_at)}
                    {d.requires_client_review === 1 && (d.approved_at ? <span className="text-green"> · approved by client {formatDate(d.approved_at)}</span> : <span className="text-amber"> · awaiting client approval</span>)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-6 border-t border-stone pt-4 md:grid-cols-2">
              <form action={staffUpload} className="space-y-2">
                <p className="label">Send a draft or final document</p>
                <input name="title" className="field" placeholder="Title (optional)" />
                <input type="file" name="file" className="text-sm" />
                <textarea name="content" rows={3} className="field" placeholder="…or paste text to create a document" />
                <div className="flex items-center gap-3">
                  <select name="kind" className="field w-auto">
                    <option value="firm_draft">Draft — client to review</option>
                    <option value="firm_final">Final document</option>
                  </select>
                  <SubmitButton className="btn-dark btn-sm" pendingText="Sending…">Send</SubmitButton>
                </div>
              </form>
              <form action={requestDocument} className="space-y-2">
                <p className="label">Request a document from the client</p>
                <input name="label" required className="field" placeholder="e.g. Government-issued photo ID" />
                <textarea name="instructions" rows={3} className="field" placeholder="Instructions (optional)" />
                <SubmitButton className="btn-outline btn-sm" pendingText="…">Request</SubmitButton>
                {requests.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate">
                    {requests.map((r) => (
                      <li key={r.id}>{r.fulfilled_document_id ? "✓" : "○"} {r.label}</li>
                    ))}
                  </ul>
                )}
              </form>
            </div>
          </section>

          {/* Meetings */}
          <section className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Video meetings</h2>
            <ul className="mt-4 divide-y divide-stone">
              {appointments.length === 0 && <li className="py-3 text-sm text-mist">None.</li>}
              {appointments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{formatDateTime(a.starts_at)} · {a.duration_minutes} min</p>
                    <p className="text-xs text-mist">{a.purpose}{a.lawyer_name ? ` · ${a.lawyer_name}` : ""} · {a.status}</p>
                  </div>
                  {a.status === "scheduled" && (
                    <form action={setMeetingStatus} className="flex gap-2">
                      <input type="hidden" name="appointment_id" value={a.id} />
                      <input type="hidden" name="matter_id" value={matter.id} />
                      <SubmitButton name="status" value="completed" className="btn-outline btn-sm" pendingText="…">Completed</SubmitButton>
                      <SubmitButton name="status" value="cancelled" className="btn-ghost btn-sm" pendingText="…">Cancel</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-stone pt-4">
              <p className="label">Book a meeting for the client</p>
              {sp.book_error === "1" && <p className="mb-2 text-xs text-red">That time is no longer available.</p>}
              <MeetingPicker matterId={matter.id} slotDays={slotDays} timeLabels={timeLabels} action={staffBookMeeting} purposeOptions={["Initial video consultation", "Follow-up discussion", "Document review", "Video signing and witnessing", "Closing"]} />
            </div>
          </section>

          {/* Billing */}
          <section className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Billing</h2>
            <ul className="mt-4 divide-y divide-stone">
              {invoices.length === 0 && <li className="py-3 text-sm text-mist">Nothing billed.</li>}
              {invoices.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{i.number} · {i.description} <span className="font-normal text-mist">· {i.kind}</span></p>
                    <p className="text-xs text-mist">{formatMoneyExact(i.amount_cents)} + HST {formatMoneyExact(i.hst_cents)} = <strong>{formatMoneyExact(i.amount_cents + i.hst_cents)}</strong> · {i.status}{i.paid_at ? ` ${formatDate(i.paid_at)}` : ""}</p>
                  </div>
                  {i.status === "due" && (
                    <form action={staffMarkPaid}>
                      <input type="hidden" name="matter_id" value={matter.id} />
                      <input type="hidden" name="invoice_id" value={i.id} />
                      <SubmitButton className="btn-outline btn-sm" pendingText="…">Mark paid</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <form action={staffIssueInvoice} className="mt-4 flex flex-wrap items-end gap-3 border-t border-stone pt-4">
              <input type="hidden" name="matter_id" value={matter.id} />
              <div className="flex-1 min-w-48">
                <label className="label" htmlFor="description">Description</label>
                <input id="description" name="description" required className="field" placeholder="e.g. Title insurance premium" />
              </div>
              <div>
                <label className="label" htmlFor="amount_dollars">Amount ($)</label>
                <input id="amount_dollars" name="amount_dollars" type="number" step="0.01" min="0" required className="field w-32" />
              </div>
              <div>
                <label className="label" htmlFor="kind">Type</label>
                <select id="kind" name="kind" className="field w-auto">
                  <option value="fee">Fee (+HST)</option>
                  <option value="retainer">Retainer (+HST)</option>
                  <option value="disbursement">Disbursement (no HST)</option>
                </select>
              </div>
              <SubmitButton className="btn-dark btn-sm" pendingText="…">Issue</SubmitButton>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Intake answers</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {service.questions.map((q) => (
                <div key={q.key}>
                  <dt className="text-xs text-mist">{q.label}</dt>
                  <dd className="text-ink">{matter.intake[q.key] || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Internal note</h2>
            <form action={addInternalNote} className="mt-3 space-y-2">
              <input type="hidden" name="matter_id" value={matter.id} />
              <textarea name="body" rows={3} required className="field" placeholder="Not visible to the client" />
              <SubmitButton className="btn-outline btn-sm" pendingText="…">Add note</SubmitButton>
            </form>
          </section>
          <section className="card p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Activity</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className={`border-l-2 pl-3 ${e.visible_to_client ? "border-gold/50" : "border-stone"}`}>
                  <p className="text-ink">{e.body}</p>
                  <p className="text-xs text-mist">{e.actor_name} · {formatDateTime(e.created_at)}{!e.visible_to_client && " · internal"}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
      <p className="sr-only">Viewing as {user.name}</p>
    </div>
  );
}
