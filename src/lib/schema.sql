CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  store_number TEXT NOT NULL,
  name TEXT NOT NULL,
  ownership TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  contact_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(customer_id, store_number)
);
CREATE INDEX IF NOT EXISTS idx_locations_customer ON locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

CREATE TABLE IF NOT EXISTS service_companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  coverage_area TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  service_company_id INTEGER REFERENCES service_companies(id),
  status TEXT NOT NULL DEFAULT 'New',
  priority TEXT NOT NULL DEFAULT 'Normal',
  equipment_description TEXT,
  issue_description TEXT NOT NULL,
  reported_by TEXT,
  reported_at TEXT NOT NULL DEFAULT (datetime('now')),
  scheduled_at TEXT,
  completed_at TEXT,
  cost REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_service_requests_location ON service_requests(location_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_company ON service_requests(service_company_id);

CREATE TABLE IF NOT EXISTS service_request_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_request_id INTEGER NOT NULL REFERENCES service_requests(id),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_request ON service_request_notes(service_request_id);

CREATE TABLE IF NOT EXISTS part_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_request_id INTEGER REFERENCES service_requests(id),
  location_id INTEGER REFERENCES locations(id),
  service_company_id INTEGER REFERENCES service_companies(id),
  carrier TEXT,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'Preparing',
  shipped_at TEXT,
  delivered_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shipments_request ON part_shipments(service_request_id);
CREATE INDEX IF NOT EXISTS idx_shipments_location ON part_shipments(location_id);

CREATE TABLE IF NOT EXISTS part_shipment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_shipment_id INTEGER NOT NULL REFERENCES part_shipments(id),
  part_id INTEGER NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON part_shipment_items(part_shipment_id);
