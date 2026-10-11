CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff')),
  name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  province TEXT,
  lawyer_id INTEGER REFERENCES lawyers(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lawyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  practice_areas TEXT NOT NULL, -- JSON array of strings
  bio TEXT NOT NULL,
  initials TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  fee_cents INTEGER NOT NULL,
  fee_label TEXT NOT NULL,          -- e.g. "Flat fee", "From", "Per document"
  fee_note TEXT,                    -- e.g. "Couples: $699"
  timeline TEXT NOT NULL,           -- e.g. "7–10 business days"
  includes TEXT NOT NULL,           -- JSON array of strings
  questions TEXT NOT NULL,          -- JSON array of {key,label,type,options?,required?,help?}
  practice_area TEXT NOT NULL,      -- which lawyers can be assigned
  consultation_minutes INTEGER NOT NULL DEFAULT 30,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS matters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,   -- e.g. DPO-2026-0001
  client_id INTEGER NOT NULL REFERENCES users(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  lawyer_id INTEGER REFERENCES lawyers(id),
  status TEXT NOT NULL DEFAULT 'intake_received',
  intake TEXT NOT NULL,             -- JSON object of answers
  other_parties TEXT,               -- names given for the conflict check
  conflict_cleared_at TEXT,
  engagement_terms TEXT,
  engagement_signed_name TEXT,
  engagement_signed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS matter_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,               -- status, note, message, document, appointment, invoice, engagement
  body TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,         -- client, staff, system
  visible_to_client INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read_by_client INTEGER NOT NULL DEFAULT 0,
  read_by_firm INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,               -- client_upload, firm_draft, firm_final, engagement_letter, identification
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  stored_name TEXT,                 -- file name inside DATA_DIR/uploads; NULL for generated text docs
  content TEXT,                     -- inline text content for generated documents
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  requires_client_review INTEGER NOT NULL DEFAULT 0,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  instructions TEXT,
  fulfilled_document_id INTEGER REFERENCES documents(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  lawyer_id INTEGER REFERENCES lawyers(id),
  starts_at TEXT NOT NULL,          -- ISO 8601 UTC
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  kind TEXT NOT NULL,               -- retainer, fee, disbursement
  amount_cents INTEGER NOT NULL,
  hst_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'due', -- due, paid, void
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_matters_client ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_events_matter ON matter_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_messages_matter ON messages(matter_id);
CREATE INDEX IF NOT EXISTS idx_documents_matter ON documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(starts_at);
