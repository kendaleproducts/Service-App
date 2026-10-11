import { db } from "@/lib/db";
import { HST_RATE } from "@/lib/types";
import type {
  Appointment,
  Document,
  DocumentRequest,
  IntakeQuestion,
  Invoice,
  Lawyer,
  Matter,
  MatterEvent,
  MatterStatus,
  MatterSummary,
  Message,
  Service,
  User,
} from "@/lib/types";

export type { User, Lawyer, Service, Matter, MatterSummary } from "@/lib/types";

type Row = Record<string, unknown>;

// ---------- Users ----------

export function getUserById(id: number): User | null {
  return (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined) ?? null;
}

export function getUserByEmail(email: string): User | null {
  return (db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim()) as User | undefined) ?? null;
}

export function createUser(input: {
  email: string;
  password_hash: string;
  role: "client" | "staff";
  name: string;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  lawyer_id?: number | null;
}): User {
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, role, name, phone, city, province, lawyer_id)
       VALUES (@email, @password_hash, @role, @name, @phone, @city, @province, @lawyer_id)`,
    )
    .run({
      email: input.email.trim(),
      password_hash: input.password_hash,
      role: input.role,
      name: input.name.trim(),
      phone: input.phone ?? null,
      city: input.city ?? null,
      province: input.province ?? null,
      lawyer_id: input.lawyer_id ?? null,
    });
  return getUserById(Number(result.lastInsertRowid))!;
}

export function updateUserProfile(id: number, input: { name: string; phone: string | null; city: string | null }) {
  db.prepare("UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?").run(input.name, input.phone, input.city, id);
}

export function listClients(): (User & { matter_count: number; open_count: number })[] {
  return db
    .prepare(
      `SELECT u.*, 
         (SELECT COUNT(*) FROM matters m WHERE m.client_id = u.id) AS matter_count,
         (SELECT COUNT(*) FROM matters m WHERE m.client_id = u.id AND m.status NOT IN ('completed','closed','cancelled')) AS open_count
       FROM users u WHERE u.role = 'client' ORDER BY u.name`,
    )
    .all() as (User & { matter_count: number; open_count: number })[];
}

// ---------- Lawyers ----------

function mapLawyer(row: Row): Lawyer {
  return { ...(row as Omit<Lawyer, "practice_areas">), practice_areas: JSON.parse(String(row.practice_areas)) };
}

export function listLawyers(): Lawyer[] {
  return (db.prepare("SELECT * FROM lawyers WHERE active = 1 ORDER BY sort_order, name").all() as Row[]).map(mapLawyer);
}

export function getLawyer(id: number): Lawyer | null {
  const row = db.prepare("SELECT * FROM lawyers WHERE id = ?").get(id) as Row | undefined;
  return row ? mapLawyer(row) : null;
}

/** The active lawyer in the practice area with the fewest open matters. */
export function pickLawyerFor(practiceArea: string): Lawyer | null {
  const candidates = listLawyers().filter((l) => l.practice_areas.includes(practiceArea));
  if (candidates.length === 0) return null;
  const counts = db
    .prepare(
      `SELECT lawyer_id, COUNT(*) AS n FROM matters
       WHERE status NOT IN ('completed','closed','cancelled') AND lawyer_id IS NOT NULL GROUP BY lawyer_id`,
    )
    .all() as { lawyer_id: number; n: number }[];
  const load = new Map(counts.map((c) => [c.lawyer_id, c.n]));
  return [...candidates].sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0))[0];
}

// ---------- Services ----------

function mapService(row: Row): Service {
  return {
    ...(row as Omit<Service, "includes" | "questions">),
    includes: JSON.parse(String(row.includes)) as string[],
    questions: JSON.parse(String(row.questions)) as IntakeQuestion[],
  };
}

export function listServices(): Service[] {
  return (db.prepare("SELECT * FROM services WHERE active = 1 ORDER BY sort_order, name").all() as Row[]).map(mapService);
}

export function getServiceBySlug(slug: string): Service | null {
  const row = db.prepare("SELECT * FROM services WHERE slug = ?").get(slug) as Row | undefined;
  return row ? mapService(row) : null;
}

export function getService(id: number): Service | null {
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as Row | undefined;
  return row ? mapService(row) : null;
}

// ---------- Matters ----------

function mapMatter<T extends Row>(row: T): T & { intake: Record<string, string> } {
  return { ...row, intake: JSON.parse(String(row.intake ?? "{}")) as Record<string, string> };
}

const MATTER_SUMMARY_SQL = `
  SELECT m.*,
    s.name AS service_name, s.slug AS service_slug, s.category AS service_category,
    c.name AS client_name, c.email AS client_email,
    l.name AS lawyer_name,
    (SELECT COUNT(*) FROM messages x WHERE x.matter_id = m.id AND x.read_by_client = 0 AND x.sender_id != m.client_id) AS unread_for_client,
    (SELECT COUNT(*) FROM messages x WHERE x.matter_id = m.id AND x.read_by_firm = 0 AND x.sender_id = m.client_id) AS unread_for_firm,
    (SELECT MIN(a.starts_at) FROM appointments a WHERE a.matter_id = m.id AND a.status = 'scheduled' AND a.starts_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')) AS next_appointment,
    (SELECT COALESCE(SUM(i.amount_cents + i.hst_cents), 0) FROM invoices i WHERE i.matter_id = m.id AND i.status = 'due') AS balance_due_cents
  FROM matters m
  JOIN services s ON s.id = m.service_id
  JOIN users c ON c.id = m.client_id
  LEFT JOIN lawyers l ON l.id = m.lawyer_id`;

export function listMattersForClient(clientId: number): MatterSummary[] {
  return (db.prepare(`${MATTER_SUMMARY_SQL} WHERE m.client_id = ? ORDER BY m.updated_at DESC`).all(clientId) as Row[]).map(
    mapMatter,
  ) as MatterSummary[];
}

export function listAllMatters(filter?: { status?: MatterStatus | "open"; lawyerId?: number }): MatterSummary[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.status === "open") where.push("m.status NOT IN ('completed','closed','cancelled')");
  else if (filter?.status) {
    where.push("m.status = ?");
    params.push(filter.status);
  }
  if (filter?.lawyerId) {
    where.push("m.lawyer_id = ?");
    params.push(filter.lawyerId);
  }
  const sql = `${MATTER_SUMMARY_SQL} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY m.updated_at DESC`;
  return (db.prepare(sql).all(...params) as Row[]).map(mapMatter) as MatterSummary[];
}

export function getMatterSummary(id: number): MatterSummary | null {
  const row = db.prepare(`${MATTER_SUMMARY_SQL} WHERE m.id = ?`).get(id) as Row | undefined;
  return row ? (mapMatter(row) as MatterSummary) : null;
}

export function getMatter(id: number): Matter | null {
  const row = db.prepare("SELECT * FROM matters WHERE id = ?").get(id) as Row | undefined;
  return row ? (mapMatter(row) as Matter) : null;
}

function nextReference(): string {
  const year = new Date().getUTCFullYear();
  const row = db.prepare("SELECT COUNT(*) AS n FROM matters WHERE reference LIKE ?").get(`DPO-${year}-%`) as { n: number };
  return `DPO-${year}-${String(row.n + 1).padStart(4, "0")}`;
}

export function touchMatter(id: number) {
  db.prepare("UPDATE matters SET updated_at = datetime('now') WHERE id = ?").run(id);
}

export function addEvent(input: {
  matter_id: number;
  kind: string;
  body: string;
  actor_name: string;
  actor_role: "client" | "staff" | "system";
  visible_to_client?: boolean;
}) {
  db.prepare(
    `INSERT INTO matter_events (matter_id, kind, body, actor_name, actor_role, visible_to_client)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(input.matter_id, input.kind, input.body, input.actor_name, input.actor_role, input.visible_to_client === false ? 0 : 1);
  touchMatter(input.matter_id);
}

export function createMatter(input: {
  client: User;
  service: Service;
  intake: Record<string, string>;
  other_parties: string | null;
  appointmentIso: string | null;
}): Matter {
  const lawyer = pickLawyerFor(input.service.practice_area);
  const reference = nextReference();
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO matters (reference, client_id, service_id, lawyer_id, status, intake, other_parties)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        reference,
        input.client.id,
        input.service.id,
        lawyer?.id ?? null,
        input.appointmentIso ? "consultation_scheduled" : "intake_received",
        JSON.stringify(input.intake),
        input.other_parties,
      );
    const matterId = Number(result.lastInsertRowid);
    addEvent({
      matter_id: matterId,
      kind: "status",
      body: `Intake received for ${input.service.name}.`,
      actor_name: input.client.name,
      actor_role: "client",
    });
    if (input.appointmentIso) {
      db.prepare(
        `INSERT INTO appointments (matter_id, lawyer_id, starts_at, duration_minutes, purpose)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(matterId, lawyer?.id ?? null, input.appointmentIso, input.service.consultation_minutes, "Initial video consultation");
      addEvent({
        matter_id: matterId,
        kind: "appointment",
        body: `Video consultation booked${lawyer ? ` with ${lawyer.name}` : ""}.`,
        actor_name: "System",
        actor_role: "system",
      });
    }
    return matterId;
  });
  return getMatter(tx())!;
}

export function setMatterStatus(matterId: number, status: MatterStatus, actorName: string) {
  const closed = status === "closed" || status === "completed" || status === "cancelled";
  db.prepare(
    `UPDATE matters SET status = ?, closed_at = CASE WHEN ? THEN datetime('now') ELSE closed_at END, updated_at = datetime('now') WHERE id = ?`,
  ).run(status, closed ? 1 : 0, matterId);
  addEvent({ matter_id: matterId, kind: "status", body: `Status updated to “${statusLabel(status)}”.`, actor_name: actorName, actor_role: "staff" });
}

function statusLabel(status: MatterStatus): string {
  return {
    intake_received: "Intake received",
    consultation_scheduled: "Consultation scheduled",
    engagement_pending: "Engagement pending",
    in_progress: "In progress",
    client_review: "Awaiting client review",
    completed: "Completed",
    closed: "Closed",
    cancelled: "Cancelled",
  }[status];
}

export function assignLawyer(matterId: number, lawyerId: number | null, actorName: string) {
  db.prepare("UPDATE matters SET lawyer_id = ?, updated_at = datetime('now') WHERE id = ?").run(lawyerId, matterId);
  const lawyer = lawyerId ? getLawyer(lawyerId) : null;
  addEvent({
    matter_id: matterId,
    kind: "note",
    body: lawyer ? `${lawyer.name} assigned as responsible lawyer.` : "Responsible lawyer unassigned.",
    actor_name: actorName,
    actor_role: "staff",
  });
}

export function clearConflict(matterId: number, actorName: string) {
  db.prepare("UPDATE matters SET conflict_cleared_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(matterId);
  addEvent({ matter_id: matterId, kind: "note", body: "Conflict check cleared.", actor_name: actorName, actor_role: "staff" });
}

export function listEvents(matterId: number, includeInternal: boolean): MatterEvent[] {
  return db
    .prepare(
      `SELECT * FROM matter_events WHERE matter_id = ? ${includeInternal ? "" : "AND visible_to_client = 1"} ORDER BY created_at DESC, id DESC`,
    )
    .all(matterId) as MatterEvent[];
}

// ---------- Engagement ----------

export function buildEngagementTerms(matter: MatterSummary, service: Service, lawyerName: string | null): string {
  const feeLine =
    service.fee_label === "Flat fee"
      ? `a flat fee of ${(service.fee_cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}`
      : `fees starting from ${(service.fee_cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}`;
  return [
    `ENGAGEMENT LETTER — ${matter.reference}`,
    ``,
    `Daniel & Partners LLP ("the Firm") is pleased to act for ${matter.client_name} ("you") in connection with: ${service.name}.`,
    ``,
    `Responsible lawyer: ${lawyerName ?? "to be confirmed"}.`,
    ``,
    `SCOPE. The Firm will provide the services described in the "${service.name}" service listing of Daniel & Partners Online, namely: ${service.includes.join("; ")}. Work outside this scope will be agreed in writing before it is started.`,
    ``,
    `FEES. The Firm will charge ${feeLine}, plus HST and any disbursements (government filing fees, registration fees, courier, title insurance and similar third-party costs). A retainer in the amount of the fee is payable before work begins and is held in trust.`,
    ``,
    `HOW WE WORK. All meetings take place by secure video. Documents are exchanged through your Daniel & Partners Online portal. Where Ontario law permits remote commissioning or witnessing, the Firm will use it; where an original signature or in-person step is required, the Firm will tell you in advance.`,
    ``,
    `CONFIDENTIALITY AND CONFLICTS. The Firm has completed a conflict check based on the names you provided. Tell us immediately if any other person or company becomes involved in this matter.`,
    ``,
    `ENDING THE RETAINER. You may end this retainer at any time. The Firm may withdraw in accordance with the rules of the Law Society of Ontario. Unearned retainer funds are returned to you.`,
    ``,
    `By typing your full legal name below you confirm you have read and agree to these terms.`,
  ].join("\n");
}

export function setEngagementTerms(matterId: number, terms: string) {
  db.prepare("UPDATE matters SET engagement_terms = ?, updated_at = datetime('now') WHERE id = ?").run(terms, matterId);
}

export function signEngagement(matterId: number, signedName: string, user: User) {
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE matters SET engagement_signed_name = ?, engagement_signed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    ).run(signedName, matterId);
    const matter = getMatter(matterId)!;
    db.prepare(
      `INSERT INTO documents (matter_id, name, kind, mime_type, size_bytes, content, uploaded_by)
       VALUES (?, ?, 'engagement_letter', 'text/plain', ?, ?, ?)`,
    ).run(
      matterId,
      `Engagement letter — signed by ${signedName}.txt`,
      Buffer.byteLength(matter.engagement_terms ?? ""),
      `${matter.engagement_terms}\n\nSigned electronically by ${signedName} on ${new Date().toISOString()}`,
      user.id,
    );
    addEvent({ matter_id: matterId, kind: "engagement", body: `Engagement letter signed by ${signedName}.`, actor_name: user.name, actor_role: "client" });
  });
  tx();
}

// ---------- Messages ----------

export function listMessages(matterId: number): Message[] {
  return db
    .prepare(
      `SELECT x.*, u.name AS sender_name, u.role AS sender_role FROM messages x JOIN users u ON u.id = x.sender_id
       WHERE x.matter_id = ? ORDER BY x.created_at ASC, x.id ASC`,
    )
    .all(matterId) as Message[];
}

export function sendMessage(matterId: number, sender: User, body: string) {
  const fromClient = sender.role === "client";
  db.prepare(
    `INSERT INTO messages (matter_id, sender_id, body, read_by_client, read_by_firm) VALUES (?, ?, ?, ?, ?)`,
  ).run(matterId, sender.id, body.trim(), fromClient ? 1 : 0, fromClient ? 0 : 1);
  addEvent({
    matter_id: matterId,
    kind: "message",
    body: `${sender.name} sent a message.`,
    actor_name: sender.name,
    actor_role: sender.role,
  });
}

export function markMessagesRead(matterId: number, reader: "client" | "staff") {
  const col = reader === "client" ? "read_by_client" : "read_by_firm";
  db.prepare(`UPDATE messages SET ${col} = 1 WHERE matter_id = ?`).run(matterId);
}

// ---------- Documents ----------

export function listDocuments(matterId: number): Document[] {
  return db
    .prepare(
      `SELECT d.*, u.name AS uploaded_by_name FROM documents d JOIN users u ON u.id = d.uploaded_by
       WHERE d.matter_id = ? ORDER BY d.created_at DESC, d.id DESC`,
    )
    .all(matterId) as Document[];
}

export function getDocument(id: number): Document | null {
  return (
    (db
      .prepare(`SELECT d.*, u.name AS uploaded_by_name FROM documents d JOIN users u ON u.id = d.uploaded_by WHERE d.id = ?`)
      .get(id) as Document | undefined) ?? null
  );
}

export function addDocument(input: {
  matter_id: number;
  name: string;
  kind: string;
  mime_type: string;
  size_bytes: number;
  stored_name: string | null;
  content: string | null;
  uploaded_by: User;
  requires_client_review?: boolean;
  fulfils_request_id?: number | null;
}): number {
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO documents (matter_id, name, kind, mime_type, size_bytes, stored_name, content, uploaded_by, requires_client_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.matter_id,
        input.name,
        input.kind,
        input.mime_type,
        input.size_bytes,
        input.stored_name,
        input.content,
        input.uploaded_by.id,
        input.requires_client_review ? 1 : 0,
      );
    const docId = Number(result.lastInsertRowid);
    if (input.fulfils_request_id) {
      db.prepare("UPDATE document_requests SET fulfilled_document_id = ? WHERE id = ? AND matter_id = ?").run(
        docId,
        input.fulfils_request_id,
        input.matter_id,
      );
    }
    addEvent({
      matter_id: input.matter_id,
      kind: "document",
      body: `${input.uploaded_by.name} added “${input.name}”${input.requires_client_review ? " for client review" : ""}.`,
      actor_name: input.uploaded_by.name,
      actor_role: input.uploaded_by.role,
    });
    return docId;
  });
  return tx();
}

export function approveDocument(docId: number, user: User) {
  const doc = getDocument(docId);
  if (!doc) return;
  db.prepare("UPDATE documents SET approved_at = datetime('now') WHERE id = ?").run(docId);
  addEvent({ matter_id: doc.matter_id, kind: "document", body: `${user.name} approved “${doc.name}”.`, actor_name: user.name, actor_role: "client" });
}

export function listDocumentRequests(matterId: number): DocumentRequest[] {
  return db.prepare("SELECT * FROM document_requests WHERE matter_id = ? ORDER BY created_at").all(matterId) as DocumentRequest[];
}

export function addDocumentRequest(matterId: number, label: string, instructions: string | null, actor: User) {
  db.prepare("INSERT INTO document_requests (matter_id, label, instructions) VALUES (?, ?, ?)").run(matterId, label, instructions);
  addEvent({ matter_id: matterId, kind: "document", body: `Requested from client: ${label}.`, actor_name: actor.name, actor_role: "staff" });
}

// ---------- Appointments ----------

export function listAppointments(matterId: number): Appointment[] {
  return db
    .prepare(
      `SELECT a.*, l.name AS lawyer_name FROM appointments a LEFT JOIN lawyers l ON l.id = a.lawyer_id
       WHERE a.matter_id = ? ORDER BY a.starts_at`,
    )
    .all(matterId) as Appointment[];
}

export function getAppointment(id: number): (Appointment & { client_id: number }) | null {
  return (
    (db
      .prepare(
        `SELECT a.*, l.name AS lawyer_name, m.reference AS matter_reference, m.client_id, s.name AS service_name
         FROM appointments a LEFT JOIN lawyers l ON l.id = a.lawyer_id
         JOIN matters m ON m.id = a.matter_id JOIN services s ON s.id = m.service_id WHERE a.id = ?`,
      )
      .get(id) as (Appointment & { client_id: number }) | undefined) ?? null
  );
}

export function listUpcomingAppointments(opts: { clientId?: number; limit?: number } = {}): Appointment[] {
  const where = ["a.status = 'scheduled'", "a.starts_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 hour')"];
  const params: unknown[] = [];
  if (opts.clientId) {
    where.push("m.client_id = ?");
    params.push(opts.clientId);
  }
  return db
    .prepare(
      `SELECT a.*, l.name AS lawyer_name, m.reference AS matter_reference, c.name AS client_name, s.name AS service_name
       FROM appointments a LEFT JOIN lawyers l ON l.id = a.lawyer_id
       JOIN matters m ON m.id = a.matter_id JOIN users c ON c.id = m.client_id JOIN services s ON s.id = m.service_id
       WHERE ${where.join(" AND ")} ORDER BY a.starts_at LIMIT ?`,
    )
    .all(...params, opts.limit ?? 50) as Appointment[];
}

export function takenSlots(lawyerId: number | null): Set<string> {
  const rows = (
    lawyerId
      ? db.prepare("SELECT starts_at FROM appointments WHERE status = 'scheduled' AND lawyer_id = ?").all(lawyerId)
      : db.prepare("SELECT starts_at FROM appointments WHERE status = 'scheduled'").all()
  ) as { starts_at: string }[];
  return new Set(rows.map((r) => r.starts_at));
}

export function bookAppointment(input: { matter_id: number; lawyer_id: number | null; starts_at: string; duration_minutes: number; purpose: string; actor: User }) {
  db.prepare(
    `INSERT INTO appointments (matter_id, lawyer_id, starts_at, duration_minutes, purpose) VALUES (?, ?, ?, ?, ?)`,
  ).run(input.matter_id, input.lawyer_id, input.starts_at, input.duration_minutes, input.purpose);
  addEvent({ matter_id: input.matter_id, kind: "appointment", body: `Video meeting booked: ${input.purpose}.`, actor_name: input.actor.name, actor_role: input.actor.role });
}

export function setAppointmentStatus(id: number, status: "scheduled" | "completed" | "cancelled", actor: User) {
  const appt = getAppointment(id);
  if (!appt) return;
  db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
  addEvent({ matter_id: appt.matter_id, kind: "appointment", body: `Meeting “${appt.purpose}” marked ${status}.`, actor_name: actor.name, actor_role: actor.role });
}

// ---------- Invoices ----------

export function listInvoices(matterId: number): Invoice[] {
  return db.prepare("SELECT * FROM invoices WHERE matter_id = ? ORDER BY issued_at DESC, id DESC").all(matterId) as Invoice[];
}

export function getInvoice(id: number): Invoice | null {
  return (db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as Invoice | undefined) ?? null;
}

function nextInvoiceNumber(): string {
  const year = new Date().getUTCFullYear();
  const row = db.prepare("SELECT COUNT(*) AS n FROM invoices WHERE number LIKE ?").get(`INV-${year}-%`) as { n: number };
  return `INV-${year}-${String(row.n + 1).padStart(4, "0")}`;
}

export function issueInvoice(input: { matter_id: number; description: string; kind: string; amount_cents: number; taxable?: boolean; actor: User }) {
  const hst = input.taxable === false ? 0 : Math.round(input.amount_cents * HST_RATE);
  db.prepare(
    `INSERT INTO invoices (matter_id, number, description, kind, amount_cents, hst_cents) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(input.matter_id, nextInvoiceNumber(), input.description, input.kind, input.amount_cents, hst);
  addEvent({
    matter_id: input.matter_id,
    kind: "invoice",
    body: `${input.kind === "retainer" ? "Retainer request" : "Invoice"} issued: ${input.description}.`,
    actor_name: input.actor.name,
    actor_role: input.actor.role,
  });
}

export function markInvoicePaid(id: number, actor: User) {
  const inv = getInvoice(id);
  if (!inv) return;
  db.prepare("UPDATE invoices SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(id);
  addEvent({ matter_id: inv.matter_id, kind: "invoice", body: `${inv.number} paid (${((inv.amount_cents + inv.hst_cents) / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}).`, actor_name: actor.name, actor_role: actor.role });
}

// ---------- Firm dashboard ----------

export function firmStats() {
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    newIntakes: count("SELECT COUNT(*) AS n FROM matters WHERE status IN ('intake_received','consultation_scheduled') AND conflict_cleared_at IS NULL"),
    open: count("SELECT COUNT(*) AS n FROM matters WHERE status NOT IN ('completed','closed','cancelled')"),
    awaitingClient: count("SELECT COUNT(*) AS n FROM matters WHERE status IN ('engagement_pending','client_review')"),
    unreadMessages: count(
      "SELECT COUNT(*) AS n FROM messages x JOIN matters m ON m.id = x.matter_id WHERE x.read_by_firm = 0 AND x.sender_id = m.client_id",
    ),
    outstandingCents: count("SELECT COALESCE(SUM(amount_cents + hst_cents),0) AS n FROM invoices WHERE status = 'due'"),
    completedThisYear: count("SELECT COUNT(*) AS n FROM matters WHERE status IN ('completed','closed') AND strftime('%Y', closed_at) = strftime('%Y','now')"),
  };
}
