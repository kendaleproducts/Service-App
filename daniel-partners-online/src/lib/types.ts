export type Role = "client" | "staff";

export type MatterStatus =
  | "intake_received"
  | "consultation_scheduled"
  | "engagement_pending"
  | "in_progress"
  | "client_review"
  | "completed"
  | "closed"
  | "cancelled";

export const MATTER_STATUS_ORDER: MatterStatus[] = [
  "intake_received",
  "consultation_scheduled",
  "engagement_pending",
  "in_progress",
  "client_review",
  "completed",
];

export const MATTER_STATUS_LABEL: Record<MatterStatus, string> = {
  intake_received: "Intake received",
  consultation_scheduled: "Consultation scheduled",
  engagement_pending: "Engagement pending",
  in_progress: "In progress",
  client_review: "Awaiting your review",
  completed: "Completed",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const MATTER_STATUS_CLIENT_HINT: Record<MatterStatus, string> = {
  intake_received:
    "We have your details. A member of the team is running the conflict check and confirming your consultation.",
  consultation_scheduled:
    "Your video consultation is booked. Have your questions and any documents ready.",
  engagement_pending:
    "Please review and sign the engagement letter and pay the retainer so we can begin work.",
  in_progress: "Your lawyer is working on your matter. We will message you if we need anything.",
  client_review: "Drafts are ready for you. Review them and approve or send comments.",
  completed: "Your matter is complete. Final documents are in the Documents section.",
  closed: "This matter is closed. The file remains available to you here.",
  cancelled: "This matter was cancelled.",
};

export type QuestionType = "text" | "textarea" | "select" | "radio" | "yesno" | "date" | "number";

export type IntakeQuestion = {
  key: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
  help?: string;
};

export type User = {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  name: string;
  phone: string | null;
  city: string | null;
  province: string | null;
  lawyer_id: number | null;
  created_at: string;
};

export type Lawyer = {
  id: number;
  name: string;
  title: string;
  practice_areas: string[];
  bio: string;
  initials: string;
  active: number;
  sort_order: number;
};

export type Service = {
  id: number;
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  fee_cents: number;
  fee_label: string;
  fee_note: string | null;
  timeline: string;
  includes: string[];
  questions: IntakeQuestion[];
  practice_area: string;
  consultation_minutes: number;
  active: number;
  sort_order: number;
};

export type Matter = {
  id: number;
  reference: string;
  client_id: number;
  service_id: number;
  lawyer_id: number | null;
  status: MatterStatus;
  intake: Record<string, string>;
  other_parties: string | null;
  conflict_cleared_at: string | null;
  engagement_terms: string | null;
  engagement_signed_name: string | null;
  engagement_signed_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type MatterSummary = Matter & {
  service_name: string;
  service_slug: string;
  service_category: string;
  client_name: string;
  client_email: string;
  lawyer_name: string | null;
  unread_for_client: number;
  unread_for_firm: number;
  next_appointment: string | null;
  balance_due_cents: number;
};

export type MatterEvent = {
  id: number;
  matter_id: number;
  kind: string;
  body: string;
  actor_name: string;
  actor_role: string;
  visible_to_client: number;
  created_at: string;
};

export type Message = {
  id: number;
  matter_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: Role;
  body: string;
  read_by_client: number;
  read_by_firm: number;
  created_at: string;
};

export type Document = {
  id: number;
  matter_id: number;
  name: string;
  kind: string;
  mime_type: string;
  size_bytes: number;
  stored_name: string | null;
  content: string | null;
  uploaded_by: number;
  uploaded_by_name: string;
  requires_client_review: number;
  approved_at: string | null;
  created_at: string;
};

export type DocumentRequest = {
  id: number;
  matter_id: number;
  label: string;
  instructions: string | null;
  fulfilled_document_id: number | null;
  created_at: string;
};

export type Appointment = {
  id: number;
  matter_id: number;
  lawyer_id: number | null;
  lawyer_name: string | null;
  starts_at: string;
  duration_minutes: number;
  purpose: string;
  status: string;
  created_at: string;
  matter_reference?: string;
  client_name?: string;
  service_name?: string;
};

export type Invoice = {
  id: number;
  matter_id: number;
  number: string;
  description: string;
  kind: string;
  amount_cents: number;
  hst_cents: number;
  status: string;
  issued_at: string;
  paid_at: string | null;
};

export const DOCUMENT_KIND_LABEL: Record<string, string> = {
  client_upload: "Uploaded by you",
  identification: "Identification",
  firm_draft: "Draft for review",
  firm_final: "Final document",
  engagement_letter: "Engagement letter",
};

export const HST_RATE = 0.13;
