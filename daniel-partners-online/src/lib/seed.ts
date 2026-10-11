import type Database from "better-sqlite3";
import { hashPassword } from "@/lib/auth";
import type { IntakeQuestion } from "@/lib/types";

/**
 * Sandbox seed: service catalogue, lawyer roster, demo accounts and two demo
 * matters so every screen has something to show. Runs once, when the
 * services table is empty. Delete data/online.db to start over.
 *
 * Fees are illustrative placeholders for the sandbox and must be set by the
 * partners before launch. Lawyer bios are placeholders to be replaced with
 * the profiles on niagaralaw.ca.
 */

const EVERYDAY = "Everyday Legal";

type SeedLawyer = { name: string; title: string; areas: string[]; initials: string };

const lawyers: SeedLawyer[] = [
  { name: "Matteson De Luca", title: "Partner", areas: ["Real Estate", "Corporate & Commercial", "Wills & Estates", EVERYDAY], initials: "MD" },
  { name: "Callum Shedden", title: "Lawyer", areas: ["Real Estate", "Wills & Estates", EVERYDAY], initials: "CS" },
  { name: "Brandon M. Boone", title: "Lawyer", areas: ["Wills & Estates", EVERYDAY], initials: "BB" },
  { name: "Donald C. DeLorenzo", title: "Lawyer", areas: ["Employment Law", "Corporate & Commercial", EVERYDAY], initials: "DD" },
];

function q(key: string, label: string, type: IntakeQuestion["type"], extra: Partial<IntakeQuestion> = {}): IntakeQuestion {
  return { key, label, type, required: true, ...extra };
}

const yesno = (key: string, label: string, help?: string) => q(key, label, "yesno", { help });

type SeedService = {
  slug: string;
  name: string;
  category: string;
  practice_area: string;
  summary: string;
  description: string;
  fee_cents: number;
  fee_label: string;
  fee_note?: string;
  timeline: string;
  includes: string[];
  questions: IntakeQuestion[];
  consultation_minutes?: number;
};

const services: SeedService[] = [
  {
    slug: "simple-will",
    name: "Will",
    category: "Wills & Estates",
    practice_area: "Wills & Estates",
    summary: "A lawyer-drafted will, reviewed with you on video and signed with remote witnessing where Ontario law allows.",
    description:
      "A properly drafted will is the single most important document most people never get around to. We prepare yours from a short questionnaire and a video meeting with your lawyer, then walk you through signing. Ontario permits wills to be witnessed by video with a licensee present, so most clients never need to visit an office.",
    fee_cents: 44900,
    fee_label: "Flat fee",
    fee_note: "Couples (mirror wills): $699",
    timeline: "7–10 business days",
    includes: [
      "Video consultation with your lawyer (30 min)",
      "Drafting of your will, including guardianship and trust provisions for minor children",
      "One round of revisions",
      "Supervised video signing and witnessing",
      "Secure digital copy and original retained by the firm on request",
    ],
    questions: [
      q("marital", "Marital status", "select", { options: ["Single", "Married", "Common-law", "Separated", "Divorced", "Widowed"] }),
      yesno("couple", "Are you and a spouse or partner both making wills?", "Mirror wills for couples are prepared together."),
      yesno("minor_children", "Do you have children under 18?"),
      q("executor", "Who would you like to name as executor (estate trustee)?", "text", { help: "Full name and relationship. You can change this later." }),
      q("assets", "Briefly describe your main assets", "textarea", { help: "Home, investments, business interests, life insurance. Approximate values are fine." }),
      yesno("existing_will", "Do you have an existing will?"),
    ],
  },
  {
    slug: "powers-of-attorney",
    name: "Powers of Attorney",
    category: "Wills & Estates",
    practice_area: "Wills & Estates",
    summary: "Continuing Power of Attorney for Property and Power of Attorney for Personal Care, prepared and signed remotely.",
    description:
      "Powers of attorney let someone you trust manage your finances and make care decisions if you cannot. We prepare both Ontario documents, explain the choices on video, and supervise remote signing.",
    fee_cents: 29900,
    fee_label: "Flat fee",
    fee_note: "Couples: $449",
    timeline: "5–7 business days",
    includes: [
      "Video consultation (30 min)",
      "Continuing Power of Attorney for Property",
      "Power of Attorney for Personal Care",
      "Supervised video signing and witnessing",
    ],
    questions: [
      q("attorney_property", "Who should act as your attorney for property?", "text"),
      q("attorney_care", "Who should act as your attorney for personal care?", "text"),
      yesno("alternates", "Would you like to name alternates?"),
      yesno("couple", "Are you and a spouse or partner both signing?"),
    ],
  },
  {
    slug: "will-and-poa-bundle",
    name: "Will & Powers of Attorney Bundle",
    category: "Wills & Estates",
    practice_area: "Wills & Estates",
    summary: "Our most popular package: a will plus both powers of attorney, one video meeting, one signing.",
    description:
      "Everything in the Will and Powers of Attorney services, handled together. One questionnaire, one consultation, one signing session.",
    fee_cents: 59900,
    fee_label: "Flat fee",
    fee_note: "Couples: $899",
    timeline: "7–10 business days",
    includes: [
      "Video consultation with your lawyer (45 min)",
      "Will with guardianship and trust provisions",
      "Continuing Power of Attorney for Property",
      "Power of Attorney for Personal Care",
      "One round of revisions and supervised video signing",
    ],
    consultation_minutes: 45,
    questions: [
      q("marital", "Marital status", "select", { options: ["Single", "Married", "Common-law", "Separated", "Divorced", "Widowed"] }),
      yesno("couple", "Are you and a spouse or partner both signing?"),
      yesno("minor_children", "Do you have children under 18?"),
      q("executor", "Executor (estate trustee)", "text"),
      q("attorney_property", "Attorney for property", "text"),
      q("attorney_care", "Attorney for personal care", "text"),
      q("assets", "Briefly describe your main assets", "textarea"),
    ],
  },
  {
    slug: "residential-purchase",
    name: "Residential Purchase",
    category: "Real Estate",
    practice_area: "Real Estate",
    summary: "Full legal representation on a home or condo purchase in Ontario, with video signing and e-registration.",
    description:
      "From reviewing your agreement of purchase and sale to registering the deed, we handle the whole closing. Title search, mortgage documents, closing funds and registration are all managed through the portal and a single video signing meeting.",
    fee_cents: 119900,
    fee_label: "From",
    fee_note: "Plus disbursements (title insurance, registration, searches)",
    timeline: "Matches your closing date",
    includes: [
      "Review of the agreement of purchase and sale",
      "Title search and title insurance arrangement",
      "Mortgage document preparation for your lender",
      "Video signing meeting before closing",
      "Electronic registration and closing-day funds handling",
      "Reporting letter and final documents in your portal",
    ],
    questions: [
      q("property_address", "Property address", "text"),
      q("closing_date", "Scheduled closing date", "date"),
      q("purchase_price", "Purchase price ($)", "number"),
      yesno("mortgage", "Will there be a mortgage?"),
      q("lender", "Lender (if known)", "text", { required: false }),
      yesno("first_time", "Are you a first-time home buyer?"),
      q("property_type", "Property type", "select", { options: ["Detached", "Semi-detached", "Townhouse", "Condominium", "Vacant land", "Other"] }),
    ],
  },
  {
    slug: "residential-sale",
    name: "Residential Sale",
    category: "Real Estate",
    practice_area: "Real Estate",
    summary: "Legal representation on the sale of your home, including mortgage discharge and funds disbursement.",
    description:
      "We prepare the transfer, respond to the buyer's requisitions, discharge your existing mortgage and deliver your proceeds, all without a trip to our office.",
    fee_cents: 99900,
    fee_label: "From",
    fee_note: "Plus disbursements",
    timeline: "Matches your closing date",
    includes: [
      "Review of the agreement of purchase and sale",
      "Transfer preparation and requisition responses",
      "Mortgage discharge",
      "Video signing meeting",
      "Proceeds delivered by direct deposit",
    ],
    questions: [
      q("property_address", "Property address", "text"),
      q("closing_date", "Scheduled closing date", "date"),
      q("sale_price", "Sale price ($)", "number"),
      yesno("mortgage", "Is there a mortgage to discharge?"),
    ],
  },
  {
    slug: "mortgage-refinance",
    name: "Mortgage Refinance",
    category: "Real Estate",
    practice_area: "Real Estate",
    summary: "Act for you on a refinance or new mortgage registration with your lender.",
    description: "We receive instructions from your lender, prepare and explain the documents on video, and register the new charge.",
    fee_cents: 79900,
    fee_label: "From",
    fee_note: "Plus disbursements",
    timeline: "5–10 business days",
    includes: ["Lender instruction review", "Mortgage document preparation", "Video signing", "Registration and funds handling"],
    questions: [
      q("property_address", "Property address", "text"),
      q("lender", "Lender", "text"),
      q("amount", "New mortgage amount ($)", "number"),
    ],
  },
  {
    slug: "incorporation",
    name: "Incorporation",
    category: "Business",
    practice_area: "Corporate & Commercial",
    summary: "Ontario or federal incorporation with organizational resolutions and a digital minute book.",
    description:
      "Incorporating properly from day one avoids expensive clean-up later. We advise on Ontario versus federal, prepare the articles, organize the corporation and give you a complete digital minute book.",
    fee_cents: 129900,
    fee_label: "Flat fee",
    fee_note: "Plus government filing fees",
    timeline: "5–7 business days",
    includes: [
      "Video consultation on structure and share classes (30 min)",
      "Articles of incorporation (Ontario or Canada)",
      "Organizational resolutions, by-laws and share subscriptions",
      "Digital minute book in your portal",
      "Guidance on CRA business number and HST registration",
    ],
    questions: [
      q("business_name", "Proposed corporation name", "text", { help: "Or 'numbered company' if you have no preference." }),
      q("jurisdiction", "Jurisdiction", "select", { options: ["Ontario", "Federal (Canada)", "Not sure — please advise"] }),
      q("shareholders", "Who will own shares, and in what proportion?", "textarea"),
      q("business_description", "What will the business do?", "textarea"),
    ],
  },
  {
    slug: "business-contract-review",
    name: "Business Contract Review",
    category: "Business",
    practice_area: "Corporate & Commercial",
    summary: "A lawyer reviews a commercial lease, supplier, services or shareholder agreement and explains it on video.",
    description: "Upload the contract, tell us what you are worried about, and get a written summary of risks plus a video walk-through with the lawyer.",
    fee_cents: 59900,
    fee_label: "From",
    fee_note: "Based on contract length",
    timeline: "3–5 business days",
    includes: ["Review of up to 25 pages", "Written risk summary", "Video meeting (30 min)", "Suggested revisions"],
    questions: [
      q("contract_type", "Type of agreement", "select", { options: ["Commercial lease", "Shareholder agreement", "Supplier / services agreement", "Franchise agreement", "Other"] }),
      q("other_party", "Who is the other party?", "text"),
      q("concerns", "What are your main concerns?", "textarea"),
    ],
  },
  {
    slug: "employment-contract-review",
    name: "Employment Contract or Severance Review",
    category: "Employment",
    practice_area: "Employment Law",
    summary: "Know what you are signing, or what you are owed, before you sign anything.",
    description:
      "Whether you have a new offer letter or a termination package, we review the documents, explain your rights under Ontario law and give you a written opinion, all within days.",
    fee_cents: 49900,
    fee_label: "Flat fee",
    timeline: "2–4 business days",
    includes: ["Document review", "Video meeting with an employment lawyer (45 min)", "Written opinion letter", "Negotiation strategy"],
    consultation_minutes: 45,
    questions: [
      q("situation", "What are you reviewing?", "select", { options: ["New offer / employment contract", "Termination or severance package", "Non-compete or non-solicit clause", "Other"] }),
      q("employer", "Employer name", "text"),
      q("deadline", "Is there a deadline to respond?", "date", { required: false }),
      q("summary", "Tell us what happened", "textarea"),
    ],
  },
  {
    slug: "independent-legal-advice",
    name: "Independent Legal Advice",
    category: "Everyday Legal",
    practice_area: EVERYDAY,
    summary: "ILA certificate for a mortgage, guarantee, separation agreement or marriage contract, by video.",
    description: "When a lender or the other side needs you to have independent advice, we review the document with you on video and issue the certificate the same day where possible.",
    fee_cents: 39900,
    fee_label: "Flat fee",
    timeline: "1–2 business days",
    includes: ["Document review", "Video meeting (30 min)", "Certificate of Independent Legal Advice"],
    questions: [
      q("document_type", "Document you need advice on", "select", { options: ["Mortgage / guarantee", "Separation agreement", "Marriage contract / cohabitation agreement", "Other"] }),
      q("requested_by", "Who has asked for the ILA?", "text"),
      q("needed_by", "Date needed by", "date", { required: false }),
    ],
  },
  {
    slug: "virtual-notary",
    name: "Virtual Notary & Commissioning",
    category: "Everyday Legal",
    practice_area: EVERYDAY,
    summary: "Affidavits, statutory declarations and consent-to-travel letters commissioned over video.",
    description:
      "Ontario allows commissioners to administer oaths remotely. Book a short video meeting, show your ID and sign while we watch. Notarial certification of copies is also available.",
    fee_cents: 4900,
    fee_label: "Per document",
    fee_note: "Additional documents in the same meeting: $25 each",
    timeline: "Same or next business day",
    includes: ["ID verification", "Video commissioning or notarization", "Commissioned PDF returned through your portal"],
    consultation_minutes: 15,
    questions: [
      q("document_type", "What needs to be commissioned or notarized?", "select", { options: ["Affidavit", "Statutory declaration", "Consent to travel", "Certified true copy", "Other"] }),
      q("count", "How many documents?", "number"),
      q("purpose", "What is it for?", "text"),
    ],
  },
  {
    slug: "consultation",
    name: "30-Minute Consultation",
    category: "Everyday Legal",
    practice_area: EVERYDAY,
    summary: "Not sure where to start? Talk to a lawyer on video. The fee is credited toward any service you go on to retain us for.",
    description: "A focused conversation with a lawyer in the right practice area. We will tell you plainly what your options are and what they would cost.",
    fee_cents: 14900,
    fee_label: "Flat fee",
    fee_note: "Credited toward any service within 30 days",
    timeline: "Next available slot",
    includes: ["30-minute video meeting", "Short written summary of options"],
    questions: [
      q("area", "What is this about?", "select", { options: ["Wills & Estates", "Real Estate", "Business", "Employment", "Something else"] }),
      q("summary", "Tell us briefly what you need help with", "textarea"),
    ],
  },
];

export function seedIfEmpty(conn: Database.Database) {
  const isEmpty = () => (conn.prepare("SELECT COUNT(*) AS n FROM services").get() as { n: number }).n === 0;
  if (!isEmpty()) return;

  const password = process.env.SANDBOX_PASSWORD || "Sandbox2026!";
  const hash = hashPassword(password);

  const tx = conn.transaction(() => {
    // `next build` opens this database from several workers at once; the
    // IMMEDIATE lock below serialises them and this re-check makes the
    // second one a no-op.
    if (!isEmpty()) return;
    const insertLawyer = conn.prepare(
      "INSERT INTO lawyers (name, title, practice_areas, bio, initials, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const lawyerIds: number[] = [];
    lawyers.forEach((l, i) => {
      const bio = `${l.name} practises in ${l.areas.filter((a) => a !== EVERYDAY).join(", ")} at Daniel & Partners LLP in St. Catharines. Profile text to be supplied from niagaralaw.ca.`;
      const r = insertLawyer.run(l.name, l.title, JSON.stringify(l.areas), bio, l.initials, (i + 1) * 10);
      lawyerIds.push(Number(r.lastInsertRowid));
    });

    const insertService = conn.prepare(
      `INSERT INTO services (slug, name, category, summary, description, fee_cents, fee_label, fee_note, timeline, includes, questions, practice_area, consultation_minutes, sort_order)
       VALUES (@slug, @name, @category, @summary, @description, @fee_cents, @fee_label, @fee_note, @timeline, @includes, @questions, @practice_area, @consultation_minutes, @sort_order)`,
    );
    const serviceIds = new Map<string, number>();
    services.forEach((s, i) => {
      const r = insertService.run({
        slug: s.slug,
        name: s.name,
        category: s.category,
        summary: s.summary,
        description: s.description,
        fee_cents: s.fee_cents,
        fee_label: s.fee_label,
        fee_note: s.fee_note ?? null,
        timeline: s.timeline,
        includes: JSON.stringify(s.includes),
        questions: JSON.stringify(s.questions),
        practice_area: s.practice_area,
        consultation_minutes: s.consultation_minutes ?? 30,
        sort_order: (i + 1) * 10,
      });
      serviceIds.set(s.slug, Number(r.lastInsertRowid));
    });

    const insertUser = conn.prepare(
      "INSERT INTO users (email, password_hash, role, name, phone, city, province, lawyer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const intakeDesk = Number(insertUser.run("intake@sandbox.test", hash, "staff", "Intake Desk", "905-688-9411", "St. Catharines", "ON", null).lastInsertRowid);
    const staffByLawyer = new Map<number, number>();
    lawyers.forEach((l, i) => {
      const email = `${l.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join(".")}@sandbox.test`;
      const id = Number(insertUser.run(email, hash, "staff", l.name, "905-688-9411", "St. Catharines", "ON", lawyerIds[i]).lastInsertRowid);
      staffByLawyer.set(lawyerIds[i], id);
    });
    const client1 = Number(insertUser.run("client@sandbox.test", hash, "client", "Jordan Avery", "289-555-0142", "Niagara Falls", "ON", null).lastInsertRowid);
    const client2 = Number(insertUser.run("priya@sandbox.test", hash, "client", "Priya Natarajan", "905-555-0198", "Welland", "ON", null).lastInsertRowid);

    const insertMatter = conn.prepare(
      `INSERT INTO matters (reference, client_id, service_id, lawyer_id, status, intake, other_parties, conflict_cleared_at, engagement_terms, engagement_signed_name, engagement_signed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertEvent = conn.prepare(
      "INSERT INTO matter_events (matter_id, kind, body, actor_name, actor_role, visible_to_client, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insertMessage = conn.prepare(
      "INSERT INTO messages (matter_id, sender_id, body, read_by_client, read_by_firm, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const insertDoc = conn.prepare(
      "INSERT INTO documents (matter_id, name, kind, mime_type, size_bytes, content, uploaded_by, requires_client_review, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertAppt = conn.prepare(
      "INSERT INTO appointments (matter_id, lawyer_id, starts_at, duration_minutes, purpose, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insertInvoice = conn.prepare(
      "INSERT INTO invoices (matter_id, number, description, kind, amount_cents, hst_cents, status, issued_at, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertReq = conn.prepare("INSERT INTO document_requests (matter_id, label, instructions, created_at) VALUES (?, ?, ?, ?)");

    const daysAgo = (n: number, h = 14) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - n);
      d.setUTCHours(h, 0, 0, 0);
      return d.toISOString().replace("T", " ").slice(0, 19);
    };
    const daysAhead = (n: number, h = 14, m = 30) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + n);
      d.setUTCHours(h, m, 0, 0);
      return d.toISOString();
    };
    const year = new Date().getUTCFullYear();

    // Matter 1: Jordan — Will & POA bundle, in client review.
    const estatesLawyer = lawyerIds[2]; // Brandon M. Boone
    const bundleId = serviceIds.get("will-and-poa-bundle")!;
    const terms1 = `ENGAGEMENT LETTER — DPO-${year}-0001\n\nDaniel & Partners LLP is pleased to act for Jordan Avery in connection with: Will & Powers of Attorney Bundle.\n\nResponsible lawyer: Brandon M. Boone.\n\nFEES. A flat fee of $599.00 plus HST, payable as a retainer before work begins and held in trust.\n\n(Sandbox sample. The live engagement letter is generated from the service listing when the firm sends it.)`;
    const m1 = Number(
      insertMatter.run(
        `DPO-${year}-0001`, client1, bundleId, estatesLawyer, "client_review",
        JSON.stringify({ marital: "Married", couple: "No", minor_children: "Yes", executor: "Sam Avery (spouse)", attorney_property: "Sam Avery", attorney_care: "Sam Avery", assets: "Home in Niagara Falls (~$650k), RRSP, TFSA, group life insurance." }),
        "Sam Avery", daysAgo(11), terms1, "Jordan Avery", daysAgo(9), daysAgo(12), daysAgo(1),
      ).lastInsertRowid,
    );
    insertEvent.run(m1, "status", "Intake received for Will & Powers of Attorney Bundle.", "Jordan Avery", "client", 1, daysAgo(12));
    insertEvent.run(m1, "appointment", "Video consultation booked with Brandon M. Boone.", "System", "system", 1, daysAgo(12));
    insertEvent.run(m1, "note", "Conflict check cleared.", "Intake Desk", "staff", 1, daysAgo(11));
    insertEvent.run(m1, "appointment", "Meeting “Initial video consultation” marked completed.", "Brandon M. Boone", "staff", 1, daysAgo(10));
    insertEvent.run(m1, "engagement", "Engagement letter sent to client.", "Brandon M. Boone", "staff", 1, daysAgo(10));
    insertEvent.run(m1, "engagement", "Engagement letter signed by Jordan Avery.", "Jordan Avery", "client", 1, daysAgo(9));
    insertEvent.run(m1, "invoice", `INV-${year}-0001 paid ($676.87).`, "Jordan Avery", "client", 1, daysAgo(9));
    insertEvent.run(m1, "status", "Status updated to “In progress”.", "Brandon M. Boone", "staff", 1, daysAgo(9));
    insertEvent.run(m1, "note", "Internal: confirm guardianship clause wording with client's sister as alternate.", "Brandon M. Boone", "staff", 0, daysAgo(4));
    insertEvent.run(m1, "document", "Brandon M. Boone added “Draft Will — Jordan Avery v1.txt” for client review.", "Brandon M. Boone", "staff", 1, daysAgo(1));
    insertEvent.run(m1, "status", "Status updated to “Awaiting client review”.", "Brandon M. Boone", "staff", 1, daysAgo(1));
    insertAppt.run(m1, estatesLawyer, daysAgo(10, 15).replace(" ", "T") + "Z", 45, "Initial video consultation", "completed", daysAgo(12));
    insertAppt.run(m1, estatesLawyer, daysAhead(4, 14, 0), 30, "Video signing and witnessing", "scheduled", daysAgo(1));
    insertInvoice.run(m1, `INV-${year}-0001`, "Retainer — Will & Powers of Attorney Bundle", "retainer", 59900, 7787, "paid", daysAgo(10), daysAgo(9));
    insertDoc.run(m1, "Engagement letter — signed by Jordan Avery.txt", "engagement_letter", "text/plain", terms1.length, `${terms1}\n\nSigned electronically by Jordan Avery.`, client1, 0, daysAgo(9));
    insertDoc.run(
      m1, "Draft Will — Jordan Avery v1.txt", "firm_draft", "text/plain", 1800,
      "LAST WILL AND TESTAMENT OF JORDAN AVERY\n\n(Sandbox sample document.)\n\n1. REVOCATION. I revoke all prior wills and codicils.\n2. ESTATE TRUSTEE. I appoint my spouse, SAM AVERY, as estate trustee. If Sam is unable or unwilling to act, I appoint my sister as alternate.\n3. GUARDIANSHIP. If my spouse does not survive me, I appoint my sister as guardian of my minor children.\n4. RESIDUE. I give the residue of my estate to my spouse, SAM AVERY, if they survive me by 30 days, failing which to my children in equal shares, to be held in trust until each attains the age of 25.\n\nPlease review sections 2 and 3 carefully and confirm the alternate names.",
      staffByLawyer.get(estatesLawyer)!, 1, daysAgo(1),
    );
    insertMessage.run(m1, staffByLawyer.get(estatesLawyer)!, "Hi Jordan, thanks for a great meeting. I have everything I need. You will see the draft in your portal within a week.", 1, 1, daysAgo(10, 16));
    insertMessage.run(m1, client1, "Thanks Brandon. One question — can I name my sister as alternate guardian rather than my brother?", 1, 1, daysAgo(5, 13));
    insertMessage.run(m1, staffByLawyer.get(estatesLawyer)!, "Yes, absolutely. I have drafted it that way. The draft will is now in Documents for your review. Please approve it or send me any comments, and we will sign on video next week.", 0, 1, daysAgo(1, 15));
    insertReq.run(m1, "Government-issued photo ID (front)", "A clear photo or scan of your driver's licence or passport, needed for the video signing.", daysAgo(10));

    // Matter 2: Jordan — employment review, just received (no consult yet).
    const emplLawyer = lawyerIds[3];
    const m2 = Number(
      insertMatter.run(
        `DPO-${year}-0002`, client1, serviceIds.get("employment-contract-review")!, emplLawyer, "consultation_scheduled",
        JSON.stringify({ situation: "Termination or severance package", employer: "Lakeshore Logistics Inc.", deadline: "", summary: "Offered 4 weeks' pay after 6 years. Asked to sign a release by next Friday." }),
        "Lakeshore Logistics Inc.", null, null, null, null, daysAgo(0, 9), daysAgo(0, 9),
      ).lastInsertRowid,
    );
    insertEvent.run(m2, "status", "Intake received for Employment Contract or Severance Review.", "Jordan Avery", "client", 1, daysAgo(0, 9));
    insertEvent.run(m2, "appointment", "Video consultation booked with Donald C. DeLorenzo.", "System", "system", 1, daysAgo(0, 9));
    insertAppt.run(m2, emplLawyer, daysAhead(2, 15, 0), 45, "Initial video consultation", "scheduled", daysAgo(0, 9));

    // Matter 3: Priya — residential purchase, engagement pending.
    const reLawyer = lawyerIds[0];
    const m3 = Number(
      insertMatter.run(
        `DPO-${year}-0003`, client2, serviceIds.get("residential-purchase")!, reLawyer, "engagement_pending",
        JSON.stringify({ property_address: "14 Rolling Meadows Blvd, Thorold, ON", closing_date: daysAhead(32).slice(0, 10), purchase_price: "715000", mortgage: "Yes", lender: "Meridian Credit Union", first_time: "No", property_type: "Detached" }),
        "Vendor: K. and M. Dufresne", daysAgo(2), null, null, null, daysAgo(3), daysAgo(1),
      ).lastInsertRowid,
    );
    conn.prepare("UPDATE matters SET engagement_terms = ? WHERE id = ?").run(
      `ENGAGEMENT LETTER — DPO-${year}-0003\n\nDaniel & Partners LLP is pleased to act for Priya Natarajan in connection with: Residential Purchase, 14 Rolling Meadows Blvd, Thorold.\n\nResponsible lawyer: Matteson De Luca.\n\nFEES. Fees from $1,199.00 plus HST and disbursements (title insurance, registration, searches). A retainer is payable before closing.\n\nBy typing your full legal name below you confirm you have read and agree to these terms.`,
      m3,
    );
    insertEvent.run(m3, "status", "Intake received for Residential Purchase.", "Priya Natarajan", "client", 1, daysAgo(3));
    insertEvent.run(m3, "note", "Conflict check cleared.", "Intake Desk", "staff", 1, daysAgo(2));
    insertEvent.run(m3, "appointment", "Meeting “Initial video consultation” marked completed.", "Matteson De Luca", "staff", 1, daysAgo(1));
    insertEvent.run(m3, "engagement", "Engagement letter sent to client.", "Matteson De Luca", "staff", 1, daysAgo(1));
    insertEvent.run(m3, "invoice", `Retainer request issued: Retainer — Residential Purchase.`, "Matteson De Luca", "staff", 1, daysAgo(1));
    insertAppt.run(m3, reLawyer, daysAgo(1, 14).replace(" ", "T") + "Z", 30, "Initial video consultation", "completed", daysAgo(3));
    insertInvoice.run(m3, `INV-${year}-0002`, "Retainer — Residential Purchase", "retainer", 119900, 15587, "due", daysAgo(1), null);
    insertMessage.run(m3, client2, "Hello — the agreement of purchase and sale is attached. Closing is in about a month.", 1, 0, daysAgo(3, 11));
    insertDoc.run(m3, "Agreement of Purchase and Sale — 14 Rolling Meadows.txt", "client_upload", "text/plain", 900, "(Sandbox sample upload.) Agreement of Purchase and Sale between K. & M. Dufresne (Vendor) and Priya Natarajan (Purchaser) for 14 Rolling Meadows Blvd, Thorold, ON. Purchase price $715,000. Deposit $35,000.", client2, 0, daysAgo(3, 11));
    insertReq.run(m3, "Mortgage commitment letter", "From Meridian, once your financing is approved.", daysAgo(1));
    insertReq.run(m3, "Government-issued photo ID (front and back)", "Needed for the lender and title insurer.", daysAgo(1));

    void intakeDesk;
  });
  tx.immediate();
}
