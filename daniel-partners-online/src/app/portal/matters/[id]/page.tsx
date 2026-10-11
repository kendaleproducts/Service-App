import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import Stepper from "@/components/Stepper";
import SubmitButton from "@/components/SubmitButton";
import {
  getLawyer,
  getMatterSummary,
  getService,
  listAppointments,
  listDocumentRequests,
  listDocuments,
  listEvents,
  listInvoices,
  listMessages,
  listUpcomingAppointments,
  markMessagesRead,
  takenSlots,
} from "@/lib/data";
import { formatBytes, formatDate, formatDateTime, formatMoneyExact, formatRelative, formatTime } from "@/lib/format";
import { availableSlots } from "@/lib/scheduling";
import { requireUser } from "@/lib/session";
import { DOCUMENT_KIND_LABEL, MATTER_STATUS_CLIENT_HINT } from "@/lib/types";
import { acceptEngagement, approveDraft, bookMeeting, payInvoice, postMessage, uploadDocument } from "../../actions";
import MeetingPicker from "./MeetingPicker";

export default async function ClientMatterPage({ params, searchParams }: PageProps<"/portal/matters/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser("client");
  const matter = getMatterSummary(Number(id));
  if (!matter || matter.client_id !== user.id) notFound();

  const service = getService(matter.service_id)!;
  const lawyer = matter.lawyer_id ? getLawyer(matter.lawyer_id) : null;
  const messages = listMessages(matter.id);
  const documents = listDocuments(matter.id);
  const requests = listDocumentRequests(matter.id);
  const appointments = listAppointments(matter.id);
  const invoices = listInvoices(matter.id);
  const events = listEvents(matter.id, false);
  markMessagesRead(matter.id, "client");

  const slotDays = availableSlots(takenSlots(matter.lawyer_id), 8, 30);
  const timeLabels: Record<string, string> = {};
  for (const d of slotDays) for (const s of d.slots) timeLabels[s.iso] = formatTime(s.iso);

  const openRequests = requests.filter((r) => !r.fulfilled_document_id);
  const drafts = documents.filter((d) => d.requires_client_review && !d.approved_at);
  const dueInvoices = invoices.filter((i) => i.status === "due");
  const upcoming = listUpcomingAppointments({ clientId: user.id, limit: 50 }).filter((a) => a.matter_id === matter.id);
  const needsSignature = Boolean(matter.engagement_terms) && !matter.engagement_signed_at;
  const isClosed = ["completed", "closed", "cancelled"].includes(matter.status);

  return (
    <div className="space-y-8">
      {sp.welcome === "1" && (
        <div className="rounded-xl border border-gold/40 bg-gold-soft/40 px-5 py-4 text-sm text-ink">
          <strong>Thank you, {user.name.split(" ")[0]}.</strong> Your intake is with the firm. We run a conflict check first, then confirm your consultation by email. Everything about this matter will appear on this page.
        </div>
      )}

      <div>
        <Link href="/portal" className="text-xs uppercase tracking-[0.18em] text-slate hover:text-gold-deep">← Dashboard</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-mist">{matter.reference} · {service.category}</p>
            <h1 className="mt-1 text-3xl normal-case tracking-normal text-brand-black">{service.name}</h1>
          </div>
          <StatusBadge status={matter.status} />
        </div>
      </div>

      <section className="card p-6">
        <Stepper status={matter.status} />
        <p className="mt-6 text-sm text-slate">{MATTER_STATUS_CLIENT_HINT[matter.status]}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Action items */}
          {!isClosed && (needsSignature || dueInvoices.length > 0 || openRequests.length > 0 || drafts.length > 0) && (
            <section className="card border-gold/50 p-6">
              <h2 className="text-sm uppercase tracking-[0.2em] text-gold-deep">What we need from you</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {needsSignature && <li><a href="#engagement" className="text-ink underline decoration-gold">Review and sign the engagement letter</a></li>}
                {dueInvoices.map((i) => (
                  <li key={i.id}><a href="#billing" className="text-ink underline decoration-gold">Pay {i.number} — {formatMoneyExact(i.amount_cents + i.hst_cents)}</a></li>
                ))}
                {openRequests.map((r) => (
                  <li key={r.id}><a href="#documents" className="text-ink underline decoration-gold">Upload: {r.label}</a></li>
                ))}
                {drafts.map((d) => (
                  <li key={d.id}><a href="#documents" className="text-ink underline decoration-gold">Review: {d.name}</a></li>
                ))}
              </ul>
            </section>
          )}

          {/* Engagement */}
          {matter.engagement_terms && (
            <section id="engagement" className="card p-6">
              <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Engagement letter</h2>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-ivory p-4 font-sans text-sm leading-relaxed text-ink">{matter.engagement_terms}</pre>
              {matter.engagement_signed_at ? (
                <p className="mt-4 text-sm text-green">Signed by {matter.engagement_signed_name} on {formatDateTime(matter.engagement_signed_at)}.</p>
              ) : (
                <form action={acceptEngagement} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <input type="hidden" name="matter_id" value={matter.id} />
                  <div className="flex-1">
                    <label className="label" htmlFor="signed_name">Type your full legal name to sign</label>
                    <input id="signed_name" name="signed_name" className="field" placeholder={user.name} required />
                    {sp.sign_error === "1" && <p className="mt-1 text-xs text-red">The name must match your account name: {user.name}.</p>}
                  </div>
                  <SubmitButton className="btn-gold" pendingText="Signing…">Sign electronically</SubmitButton>
                </form>
              )}
            </section>
          )}

          {/* Messages */}
          <section id="messages" className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Messages</h2>
            <div className="mt-4 space-y-4">
              {messages.length === 0 && <p className="text-sm text-mist">No messages yet. Your lawyer will reply here.</p>}
              {messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                    <Avatar initials={m.sender_name.split(" ").map((p) => p[0]).slice(0, 2).join("")} size="sm" tone={mine ? "light" : "dark"} />
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${mine ? "bg-ivory text-ink" : "bg-brand-black text-white"}`}>
                      <p className={`text-[10px] uppercase tracking-[0.14em] ${mine ? "text-mist" : "text-gold"}`}>{m.sender_name} · {formatRelative(m.created_at)}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isClosed && (
              <form action={postMessage} className="mt-5 space-y-3">
                <input type="hidden" name="matter_id" value={matter.id} />
                <textarea name="body" rows={3} required className="field" placeholder="Write to your lawyer…" />
                <SubmitButton className="btn-dark btn-sm" pendingText="Sending…">Send message</SubmitButton>
              </form>
            )}
          </section>

          {/* Documents */}
          <section id="documents" className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Documents</h2>
            {openRequests.length > 0 && (
              <div className="mt-4 space-y-3">
                {openRequests.map((r) => (
                  <form key={r.id} action={uploadDocument} className="rounded-lg border border-amber/40 bg-amber-soft/40 p-4">
                    <input type="hidden" name="matter_id" value={matter.id} />
                    <input type="hidden" name="request_id" value={r.id} />
                    <p className="text-sm font-semibold text-ink">Requested: {r.label}</p>
                    {r.instructions && <p className="mt-1 text-xs text-slate">{r.instructions}</p>}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input type="file" name="file" required className="text-sm" />
                      <SubmitButton className="btn-dark btn-sm" pendingText="Uploading…">Upload</SubmitButton>
                    </div>
                  </form>
                ))}
              </div>
            )}
            <ul className="mt-4 divide-y divide-stone">
              {documents.length === 0 && <li className="py-3 text-sm text-mist">No documents yet.</li>}
              {documents.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <a href={`/api/documents/${d.id}`} className="font-semibold text-ink hover:text-gold-deep">{d.name}</a>
                    <p className="text-xs text-mist">
                      {DOCUMENT_KIND_LABEL[d.kind] ?? d.kind} · {formatBytes(d.size_bytes)} · {formatDate(d.created_at)}
                      {d.approved_at && <span className="text-green"> · Approved {formatDate(d.approved_at)}</span>}
                    </p>
                  </div>
                  {d.requires_client_review === 1 && !d.approved_at && !isClosed && (
                    <form action={approveDraft}>
                      <input type="hidden" name="document_id" value={d.id} />
                      <SubmitButton className="btn-gold btn-sm" pendingText="Approving…">Approve draft</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {!isClosed && (
              <form action={uploadDocument} className="mt-4 flex flex-col gap-2 border-t border-stone pt-4 sm:flex-row sm:items-center">
                <input type="hidden" name="matter_id" value={matter.id} />
                <label className="text-xs uppercase tracking-[0.14em] text-slate">Upload a document</label>
                <input type="file" name="file" required className="text-sm" />
                <SubmitButton className="btn-outline btn-sm" pendingText="Uploading…">Upload</SubmitButton>
              </form>
            )}
            <p className="mt-3 text-xs text-mist">Drafts: use the message box to send comments, or approve when you are satisfied. Files up to 10 MB.</p>
          </section>

          {/* Meetings */}
          <section id="meetings" className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Video meetings</h2>
            <ul className="mt-4 divide-y divide-stone">
              {appointments.length === 0 && <li className="py-3 text-sm text-mist">No meetings yet.</li>}
              {appointments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{formatDateTime(a.starts_at)} · {a.duration_minutes} min</p>
                    <p className="text-xs text-mist">{a.purpose}{a.lawyer_name ? ` with ${a.lawyer_name}` : ""} · {a.status}</p>
                  </div>
                  {a.status === "scheduled" && <Link href={`/portal/meet/${a.id}`} className="btn-outline btn-sm">Join video room</Link>}
                </li>
              ))}
            </ul>
            {!isClosed && upcoming.length === 0 && (
              <div className="mt-4 border-t border-stone pt-4">
                <p className="mb-3 text-sm text-slate">Book a video meeting{lawyer ? ` with ${lawyer.name}` : ""}. Times are Eastern (Toronto).</p>
                {sp.book_error === "1" && <p className="mb-2 text-xs text-red">That time is no longer available. Please choose another.</p>}
                <MeetingPicker matterId={matter.id} slotDays={slotDays} timeLabels={timeLabels} action={bookMeeting} purposeOptions={["Initial video consultation", "Follow-up discussion", "Document review", "Signing"]} />
              </div>
            )}
          </section>

          {/* Billing */}
          <section id="billing" className="card p-6">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Billing</h2>
            <ul className="mt-4 divide-y divide-stone">
              {invoices.length === 0 && <li className="py-3 text-sm text-mist">Nothing has been billed. Fees are payable only after you sign the engagement letter.</li>}
              {invoices.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{i.number} · {i.description}</p>
                    <p className="text-xs text-mist">
                      {formatMoneyExact(i.amount_cents)} + HST {formatMoneyExact(i.hst_cents)} = <strong>{formatMoneyExact(i.amount_cents + i.hst_cents)}</strong> · issued {formatDate(i.issued_at)}
                      {i.paid_at && <span className="text-green"> · paid {formatDate(i.paid_at)}</span>}
                    </p>
                  </div>
                  {i.status === "due" ? (
                    <form action={payInvoice}>
                      <input type="hidden" name="invoice_id" value={i.id} />
                      <SubmitButton className="btn-gold btn-sm" pendingText="Processing…">Pay {formatMoneyExact(i.amount_cents + i.hst_cents)}</SubmitButton>
                    </form>
                  ) : (
                    <span className="rounded-full bg-green-soft px-2.5 py-1 text-[10px] font-display uppercase tracking-[0.16em] text-green">{i.status}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-mist">Sandbox: “Pay” records the payment without charging a card. Production connects a trust-account-compliant payment processor.</p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card-dark p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-gold">Your lawyer</h2>
            {lawyer ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar initials={lawyer.initials} tone="gold" />
                <div>
                  <p className="font-display text-sm tracking-[0.06em]">{lawyer.name}</p>
                  <p className="text-xs text-white/60">{lawyer.title}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/60">A lawyer will be assigned after the conflict check.</p>
            )}
            {upcoming[0] && (
              <div className="mt-4 border-t border-white/10 pt-4 text-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-white/50">Next meeting</p>
                <p className="mt-1 font-semibold">{formatDateTime(upcoming[0].starts_at)}</p>
                <Link href={`/portal/meet/${upcoming[0].id}`} className="mt-2 inline-block text-xs uppercase tracking-[0.16em] text-gold hover:underline">Join video room →</Link>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Your answers</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {service.questions.map((q) => (
                <div key={q.key}>
                  <dt className="text-xs text-mist">{q.label}</dt>
                  <dd className="text-ink">{matter.intake[q.key] || "—"}</dd>
                </div>
              ))}
              {matter.other_parties && (
                <div>
                  <dt className="text-xs text-mist">Other parties</dt>
                  <dd className="text-ink">{matter.other_parties}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate">Activity</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-gold/50 pl-3">
                  <p className="text-ink">{e.body}</p>
                  <p className="text-xs text-mist">{formatDateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
