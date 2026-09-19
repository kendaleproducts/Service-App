import { db } from "./db";
import type {
  Customer,
  Location,
  Part,
  PartShipment,
  PartShipmentItem,
  ServiceCompany,
  ServiceRequestNote,
  ServiceRequestWithJoins,
} from "./types";

// ---------- Customers ----------

export function listCustomers(): Customer[] {
  return db.prepare("SELECT * FROM customers ORDER BY name").all() as Customer[];
}

export function getOrCreateCustomer(name: string): Customer {
  const existing = db
    .prepare("SELECT * FROM customers WHERE name = ?")
    .get(name) as Customer | undefined;
  if (existing) return existing;
  const info = db.prepare("INSERT INTO customers (name) VALUES (?)").run(name);
  return db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(info.lastInsertRowid) as Customer;
}

// ---------- Locations ----------

export function listLocations(filters: {
  q?: string;
  status?: string;
  province?: string;
}): Location[] {
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filters.q) {
    clauses.push(
      "(name LIKE @q OR store_number LIKE @q OR city LIKE @q OR address LIKE @q)"
    );
    params.q = `%${filters.q}%`;
  }
  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }
  if (filters.province) {
    clauses.push("province = @province");
    params.province = filters.province;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(`SELECT * FROM locations ${where} ORDER BY store_number`)
    .all(params) as Location[];
}

export function listLocationsMissingCoordinates(): Location[] {
  return db
    .prepare(
      "SELECT * FROM locations WHERE latitude IS NULL AND address IS NOT NULL AND address != '' ORDER BY store_number"
    )
    .all() as Location[];
}

export function listGeocodedLocations(): Location[] {
  return db
    .prepare(
      "SELECT * FROM locations WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND status = 'Open' ORDER BY store_number"
    )
    .all() as Location[];
}

export function listGeocodedServiceCompanies(): ServiceCompany[] {
  return db
    .prepare(
      "SELECT * FROM service_companies WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY name"
    )
    .all() as ServiceCompany[];
}

export function getLocation(id: number): Location | undefined {
  return db.prepare("SELECT * FROM locations WHERE id = ?").get(id) as
    | Location
    | undefined;
}

export function listProvinces(): string[] {
  const rows = db
    .prepare(
      "SELECT DISTINCT province FROM locations WHERE province IS NOT NULL AND province != '' ORDER BY province"
    )
    .all() as { province: string }[];
  return rows.map((r) => r.province);
}

export function createLocation(input: {
  customer_id: number;
  store_number: string;
  name: string;
  ownership?: string | null;
  status?: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  notes?: string | null;
}): number {
  const info = db
    .prepare(
      `INSERT INTO locations
        (customer_id, store_number, name, ownership, status, address, city, province, postal_code, phone, contact_name, notes)
       VALUES (@customer_id, @store_number, @name, @ownership, @status, @address, @city, @province, @postal_code, @phone, @contact_name, @notes)`
    )
    .run({
      ownership: null,
      status: "Open",
      address: null,
      city: null,
      province: null,
      postal_code: null,
      phone: null,
      contact_name: null,
      notes: null,
      ...input,
    });
  return Number(info.lastInsertRowid);
}

export function updateLocation(
  id: number,
  input: Partial<{
    name: string;
    ownership: string | null;
    status: string;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    phone: string | null;
    contact_name: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  }>
): void {
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  db.prepare(
    `UPDATE locations SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...input, id });
}

export function upsertLocationByStoreNumber(input: {
  customer_id: number;
  store_number: string;
  name: string;
  ownership: string | null;
  status: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
}): "inserted" | "updated" {
  const existing = db
    .prepare(
      "SELECT id FROM locations WHERE customer_id = ? AND store_number = ?"
    )
    .get(input.customer_id, input.store_number) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE locations SET name=@name, ownership=@ownership, status=@status, address=@address,
        city=@city, province=@province, postal_code=@postal_code, updated_at=datetime('now')
       WHERE id=@id`
    ).run({ ...input, id: existing.id });
    return "updated";
  }
  db.prepare(
    `INSERT INTO locations (customer_id, store_number, name, ownership, status, address, city, province, postal_code)
     VALUES (@customer_id, @store_number, @name, @ownership, @status, @address, @city, @province, @postal_code)`
  ).run(input);
  return "inserted";
}

// ---------- Service companies ----------

export function listServiceCompanies(): ServiceCompany[] {
  return db.prepare("SELECT * FROM service_companies ORDER BY name").all() as ServiceCompany[];
}

export function getServiceCompany(id: number): ServiceCompany | undefined {
  return db.prepare("SELECT * FROM service_companies WHERE id = ?").get(id) as
    | ServiceCompany
    | undefined;
}

export function createServiceCompany(input: {
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  coverage_area?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}): number {
  const info = db
    .prepare(
      `INSERT INTO service_companies
        (name, contact_name, phone, email, coverage_area, address, city, province, postal_code, country, latitude, longitude, notes)
       VALUES (@name, @contact_name, @phone, @email, @coverage_area, @address, @city, @province, @postal_code, @country, @latitude, @longitude, @notes)`
    )
    .run({
      contact_name: null,
      phone: null,
      email: null,
      coverage_area: null,
      address: null,
      city: null,
      province: null,
      postal_code: null,
      country: null,
      latitude: null,
      longitude: null,
      notes: null,
      ...input,
    });
  return Number(info.lastInsertRowid);
}

export function updateServiceCompany(
  id: number,
  input: Partial<{
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    coverage_area: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  }>
): void {
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  db.prepare(
    `UPDATE service_companies SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...input, id });
}

export function upsertServiceCompanyByNameAndPostalCode(input: {
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  coverage_area: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}): "inserted" | "updated" {
  // Matched by name + postal code (or + city if no postal code) rather than
  // name alone, since the same company can have multiple regional branches.
  const existing = input.postal_code
    ? (db
        .prepare(
          "SELECT id FROM service_companies WHERE lower(name) = lower(?) AND lower(postal_code) = lower(?)"
        )
        .get(input.name, input.postal_code) as { id: number } | undefined)
    : (db
        .prepare(
          "SELECT id FROM service_companies WHERE lower(name) = lower(?) AND lower(coalesce(city, '')) = lower(?)"
        )
        .get(input.name, input.city ?? "") as { id: number } | undefined);

  if (existing) {
    db.prepare(
      `UPDATE service_companies SET contact_name=@contact_name, phone=@phone, email=@email,
        coverage_area=@coverage_area, address=@address, city=@city, province=@province,
        postal_code=@postal_code, country=@country, latitude=@latitude, longitude=@longitude,
        notes=@notes, updated_at=datetime('now')
       WHERE id=@id`
    ).run({ ...input, id: existing.id });
    return "updated";
  }
  db.prepare(
    `INSERT INTO service_companies
      (name, contact_name, phone, email, coverage_area, address, city, province, postal_code, country, latitude, longitude, notes)
     VALUES (@name, @contact_name, @phone, @email, @coverage_area, @address, @city, @province, @postal_code, @country, @latitude, @longitude, @notes)`
  ).run(input);
  return "inserted";
}

// ---------- Parts ----------

export function listParts(q?: string): Part[] {
  if (q) {
    return db
      .prepare(
        "SELECT * FROM parts WHERE part_number LIKE ? OR description LIKE ? ORDER BY part_number"
      )
      .all(`%${q}%`, `%${q}%`) as Part[];
  }
  return db.prepare("SELECT * FROM parts ORDER BY part_number").all() as Part[];
}

export function listLowStockParts(): Part[] {
  return db
    .prepare(
      "SELECT * FROM parts WHERE quantity_on_hand <= reorder_threshold ORDER BY part_number"
    )
    .all() as Part[];
}

export function getPart(id: number): Part | undefined {
  return db.prepare("SELECT * FROM parts WHERE id = ?").get(id) as Part | undefined;
}

export function createPart(input: {
  part_number: string;
  description: string;
  quantity_on_hand?: number;
  reorder_threshold?: number;
  unit_cost?: number | null;
  notes?: string | null;
}): number {
  const info = db
    .prepare(
      `INSERT INTO parts (part_number, description, quantity_on_hand, reorder_threshold, unit_cost, notes)
       VALUES (@part_number, @description, @quantity_on_hand, @reorder_threshold, @unit_cost, @notes)`
    )
    .run({
      quantity_on_hand: 0,
      reorder_threshold: 0,
      unit_cost: null,
      notes: null,
      ...input,
    });
  return Number(info.lastInsertRowid);
}

export function updatePart(
  id: number,
  input: Partial<{
    description: string;
    quantity_on_hand: number;
    reorder_threshold: number;
    unit_cost: number | null;
    notes: string | null;
  }>
): void {
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  db.prepare(
    `UPDATE parts SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...input, id });
}

export function adjustPartQuantity(id: number, delta: number): void {
  db.prepare(
    "UPDATE parts SET quantity_on_hand = quantity_on_hand + ?, updated_at = datetime('now') WHERE id = ?"
  ).run(delta, id);
}

// ---------- Service requests ----------

export function listServiceRequests(filters: {
  status?: string;
  priority?: string;
  locationId?: number;
  companyId?: number;
}): ServiceRequestWithJoins[] {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};
  if (filters.status) {
    clauses.push("sr.status = @status");
    params.status = filters.status;
  }
  if (filters.priority) {
    clauses.push("sr.priority = @priority");
    params.priority = filters.priority;
  }
  if (filters.locationId) {
    clauses.push("sr.location_id = @locationId");
    params.locationId = filters.locationId;
  }
  if (filters.companyId) {
    clauses.push("sr.service_company_id = @companyId");
    params.companyId = filters.companyId;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT sr.*, l.name as location_name, l.store_number as store_number,
              l.city as city, l.province as province,
              sc.name as service_company_name
       FROM service_requests sr
       JOIN locations l ON l.id = sr.location_id
       LEFT JOIN service_companies sc ON sc.id = sr.service_company_id
       ${where}
       ORDER BY sr.created_at DESC`
    )
    .all(params) as ServiceRequestWithJoins[];
}

export function getServiceRequest(id: number): ServiceRequestWithJoins | undefined {
  return db
    .prepare(
      `SELECT sr.*, l.name as location_name, l.store_number as store_number,
              l.city as city, l.province as province,
              sc.name as service_company_name
       FROM service_requests sr
       JOIN locations l ON l.id = sr.location_id
       LEFT JOIN service_companies sc ON sc.id = sr.service_company_id
       WHERE sr.id = ?`
    )
    .get(id) as ServiceRequestWithJoins | undefined;
}

export function createServiceRequest(input: {
  location_id: number;
  service_company_id?: number | null;
  status?: string;
  priority?: string;
  equipment_description?: string | null;
  issue_description: string;
  reported_by?: string | null;
  scheduled_at?: string | null;
}): number {
  const info = db
    .prepare(
      `INSERT INTO service_requests
        (location_id, service_company_id, status, priority, equipment_description, issue_description, reported_by, scheduled_at)
       VALUES (@location_id, @service_company_id, @status, @priority, @equipment_description, @issue_description, @reported_by, @scheduled_at)`
    )
    .run({
      service_company_id: null,
      status: "New",
      priority: "Normal",
      equipment_description: null,
      reported_by: null,
      scheduled_at: null,
      ...input,
    });
  return Number(info.lastInsertRowid);
}

export function updateServiceRequest(
  id: number,
  input: Partial<{
    service_company_id: number | null;
    status: string;
    priority: string;
    equipment_description: string | null;
    issue_description: string;
    reported_by: string | null;
    scheduled_at: string | null;
    completed_at: string | null;
    cost: number | null;
  }>
): void {
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  db.prepare(
    `UPDATE service_requests SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...input, id });
}

export function addServiceRequestNote(serviceRequestId: number, note: string): void {
  db.prepare(
    "INSERT INTO service_request_notes (service_request_id, note) VALUES (?, ?)"
  ).run(serviceRequestId, note);
}

export function listServiceRequestNotes(serviceRequestId: number): ServiceRequestNote[] {
  return db
    .prepare(
      "SELECT * FROM service_request_notes WHERE service_request_id = ? ORDER BY created_at DESC"
    )
    .all(serviceRequestId) as ServiceRequestNote[];
}

// ---------- Part shipments ----------

export function listPartShipments(): (PartShipment & {
  location_name: string | null;
  service_company_name: string | null;
})[] {
  return db
    .prepare(
      `SELECT ps.*, l.name as location_name, sc.name as service_company_name
       FROM part_shipments ps
       LEFT JOIN locations l ON l.id = ps.location_id
       LEFT JOIN service_companies sc ON sc.id = ps.service_company_id
       ORDER BY ps.created_at DESC`
    )
    .all() as (PartShipment & {
    location_name: string | null;
    service_company_name: string | null;
  })[];
}

export function listShipmentsForRequest(serviceRequestId: number): (PartShipment & {
  location_name: string | null;
  service_company_name: string | null;
})[] {
  return db
    .prepare(
      `SELECT ps.*, l.name as location_name, sc.name as service_company_name
       FROM part_shipments ps
       LEFT JOIN locations l ON l.id = ps.location_id
       LEFT JOIN service_companies sc ON sc.id = ps.service_company_id
       WHERE ps.service_request_id = ?
       ORDER BY ps.created_at DESC`
    )
    .all(serviceRequestId) as (PartShipment & {
    location_name: string | null;
    service_company_name: string | null;
  })[];
}

export function getPartShipment(id: number):
  | (PartShipment & { location_name: string | null; service_company_name: string | null })
  | undefined {
  return db
    .prepare(
      `SELECT ps.*, l.name as location_name, sc.name as service_company_name
       FROM part_shipments ps
       LEFT JOIN locations l ON l.id = ps.location_id
       LEFT JOIN service_companies sc ON sc.id = ps.service_company_id
       WHERE ps.id = ?`
    )
    .get(id) as
    | (PartShipment & { location_name: string | null; service_company_name: string | null })
    | undefined;
}

export function listShipmentItems(
  shipmentId: number
): (PartShipmentItem & { part_number: string; description: string })[] {
  return db
    .prepare(
      `SELECT psi.*, p.part_number, p.description
       FROM part_shipment_items psi
       JOIN parts p ON p.id = psi.part_id
       WHERE psi.part_shipment_id = ?`
    )
    .all(shipmentId) as (PartShipmentItem & {
    part_number: string;
    description: string;
  })[];
}

export function createPartShipment(
  input: {
    service_request_id?: number | null;
    location_id?: number | null;
    service_company_id?: number | null;
    carrier?: string | null;
    tracking_number?: string | null;
    status?: string;
    notes?: string | null;
  },
  items: { part_id: number; quantity: number }[]
): number {
  const createShipment = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO part_shipments
          (service_request_id, location_id, service_company_id, carrier, tracking_number, status, notes)
         VALUES (@service_request_id, @location_id, @service_company_id, @carrier, @tracking_number, @status, @notes)`
      )
      .run({
        service_request_id: null,
        location_id: null,
        service_company_id: null,
        carrier: null,
        tracking_number: null,
        status: "Preparing",
        notes: null,
        ...input,
      });
    const shipmentId = Number(info.lastInsertRowid);
    const insertItem = db.prepare(
      "INSERT INTO part_shipment_items (part_shipment_id, part_id, quantity) VALUES (?, ?, ?)"
    );
    const decrementPart = db.prepare(
      "UPDATE parts SET quantity_on_hand = quantity_on_hand - ?, updated_at = datetime('now') WHERE id = ?"
    );
    for (const item of items) {
      if (item.quantity <= 0) continue;
      insertItem.run(shipmentId, item.part_id, item.quantity);
      decrementPart.run(item.quantity, item.part_id);
    }
    return shipmentId;
  });
  return createShipment();
}

export function updatePartShipmentStatus(
  id: number,
  status: string,
  extra: Partial<{ shipped_at: string | null; delivered_at: string | null; tracking_number: string | null; carrier: string | null }> = {}
): void {
  const fields = { status, ...extra };
  const setClause = Object.keys(fields)
    .map((f) => `${f} = @${f}`)
    .join(", ");
  db.prepare(
    `UPDATE part_shipments SET ${setClause}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...fields, id });
}

export function listShipmentsForPart(partId: number): {
  id: number;
  quantity: number;
  status: string;
  shipped_at: string | null;
  created_at: string;
  location_name: string | null;
  service_company_name: string | null;
}[] {
  return db
    .prepare(
      `SELECT ps.id, psi.quantity, ps.status, ps.shipped_at, ps.created_at,
              l.name as location_name, sc.name as service_company_name
       FROM part_shipment_items psi
       JOIN part_shipments ps ON ps.id = psi.part_shipment_id
       LEFT JOIN locations l ON l.id = ps.location_id
       LEFT JOIN service_companies sc ON sc.id = ps.service_company_id
       WHERE psi.part_id = ?
       ORDER BY ps.created_at DESC`
    )
    .all(partId) as {
    id: number;
    quantity: number;
    status: string;
    shipped_at: string | null;
    created_at: string;
    location_name: string | null;
    service_company_name: string | null;
  }[];
}

// ---------- Dashboard ----------

export function getDashboardStats() {
  const openRequests = db
    .prepare(
      "SELECT COUNT(*) as c FROM service_requests WHERE status NOT IN ('Completed', 'Cancelled')"
    )
    .get() as { c: number };
  const urgentRequests = db
    .prepare(
      "SELECT COUNT(*) as c FROM service_requests WHERE priority = 'Urgent' AND status NOT IN ('Completed', 'Cancelled')"
    )
    .get() as { c: number };
  const lowStockParts = db
    .prepare("SELECT COUNT(*) as c FROM parts WHERE quantity_on_hand <= reorder_threshold")
    .get() as { c: number };
  const shipmentsInTransit = db
    .prepare("SELECT COUNT(*) as c FROM part_shipments WHERE status = 'Shipped'")
    .get() as { c: number };
  const totalLocations = db
    .prepare("SELECT COUNT(*) as c FROM locations WHERE status = 'Open'")
    .get() as { c: number };
  const recentRequests = db
    .prepare(
      `SELECT sr.*, l.name as location_name, l.store_number as store_number,
              l.city as city, l.province as province,
              sc.name as service_company_name
       FROM service_requests sr
       JOIN locations l ON l.id = sr.location_id
       LEFT JOIN service_companies sc ON sc.id = sr.service_company_id
       ORDER BY sr.created_at DESC LIMIT 8`
    )
    .all() as ServiceRequestWithJoins[];

  return {
    openRequests: openRequests.c,
    urgentRequests: urgentRequests.c,
    lowStockParts: lowStockParts.c,
    shipmentsInTransit: shipmentsInTransit.c,
    totalLocations: totalLocations.c,
    recentRequests,
  };
}
