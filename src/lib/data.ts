import { db } from "./db";
import { haversineKm } from "./geo";
import type {
  Customer,
  Equipment,
  Location,
  Part,
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
      "SELECT * FROM locations WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY store_number"
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

export function listNearestServiceCompanies(
  locationId: number,
  limit = 3
): (ServiceCompany & { distanceKm: number })[] {
  const location = getLocation(locationId);
  if (!location || location.latitude == null || location.longitude == null) {
    return [];
  }
  const candidates = listGeocodedServiceCompanies();
  return candidates
    .map((c) => ({
      ...c,
      distanceKm: haversineKm(
        location.latitude as number,
        location.longitude as number,
        c.latitude as number,
        c.longitude as number
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
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

export const deleteAllServiceCompanies = db.transaction(() => {
  // Unassign rather than delete so existing service request / shipment
  // history isn't lost when the vendor list is replaced wholesale.
  db.prepare(
    "UPDATE service_requests SET service_company_id = NULL WHERE service_company_id IS NOT NULL"
  ).run();
  db.prepare(
    "UPDATE part_shipments SET service_company_id = NULL WHERE service_company_id IS NOT NULL"
  ).run();
  db.prepare("DELETE FROM service_companies").run();
});

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

export function getPart(id: number): Part | undefined {
  return db.prepare("SELECT * FROM parts WHERE id = ?").get(id) as Part | undefined;
}

export function createPart(input: {
  part_number: string;
  description: string;
  notes?: string | null;
}): number {
  const info = db
    .prepare(
      `INSERT INTO parts (part_number, description, notes)
       VALUES (@part_number, @description, @notes)`
    )
    .run({
      notes: null,
      ...input,
    });
  return Number(info.lastInsertRowid);
}

export function updatePart(
  id: number,
  input: Partial<{
    description: string;
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

// ---------- Equipment ----------

export function getEquipment(id: number): Equipment | undefined {
  return db.prepare("SELECT * FROM equipment WHERE id = ?").get(id) as Equipment | undefined;
}

export function listEquipmentForLocation(locationId: number): Equipment[] {
  return db
    .prepare("SELECT * FROM equipment WHERE location_id = ? ORDER BY created_at DESC")
    .all(locationId) as Equipment[];
}

export function getOrCreateEquipment(input: {
  location_id: number;
  serial_number: string;
  description?: string | null;
}): number {
  const serial = input.serial_number.trim();
  const existing = db
    .prepare(
      "SELECT id FROM equipment WHERE location_id = @location_id AND lower(trim(serial_number)) = lower(@serial)"
    )
    .get({ location_id: input.location_id, serial }) as { id: number } | undefined;
  if (existing) return existing.id;

  const info = db
    .prepare(
      "INSERT INTO equipment (location_id, serial_number, description) VALUES (@location_id, @serial_number, @description)"
    )
    .run({
      location_id: input.location_id,
      serial_number: serial,
      description: input.description || null,
    });
  return Number(info.lastInsertRowid);
}

// ---------- Service requests ----------

export function listServiceRequests(filters: {
  q?: string;
  status?: string;
  priority?: string;
  locationId?: number;
  companyId?: number;
  province?: string;
  from?: string;
  to?: string;
}): ServiceRequestWithJoins[] {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};
  if (filters.q) {
    clauses.push("(l.name LIKE @q OR l.store_number LIKE @q OR l.city LIKE @q)");
    params.q = `%${filters.q}%`;
  }
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
  if (filters.province) {
    clauses.push("l.province = @province");
    params.province = filters.province;
  }
  if (filters.from) {
    clauses.push("date(sr.reported_at) >= date(@from)");
    params.from = filters.from;
  }
  if (filters.to) {
    clauses.push("date(sr.reported_at) <= date(@to)");
    params.to = filters.to;
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

export interface ServiceRequestReport {
  requests: ServiceRequestWithJoins[];
  totalCount: number;
  totalCost: number;
  avgCost: number | null;
  byStatus: { label: string; count: number }[];
  byPriority: { label: string; count: number }[];
  byCompany: { label: string; count: number }[];
}

export function getServiceRequestReport(filters: {
  from?: string;
  to?: string;
  status?: string;
  priority?: string;
  province?: string;
  companyId?: number;
}): ServiceRequestReport {
  const requests = listServiceRequests(filters);

  const countBy = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  const costs = requests.map((r) => r.cost).filter((c): c is number => c != null);
  const totalCost = costs.reduce((sum, c) => sum + c, 0);

  return {
    requests,
    totalCount: requests.length,
    totalCost,
    avgCost: costs.length ? totalCost / costs.length : null,
    byStatus: countBy(requests.map((r) => r.status)),
    byPriority: countBy(requests.map((r) => r.priority)),
    byCompany: countBy(requests.map((r) => r.service_company_name ?? "Unassigned")),
  };
}

export function getServiceRequest(id: number): ServiceRequestWithJoins | undefined {
  return db
    .prepare(
      `SELECT sr.*, l.name as location_name, l.store_number as store_number,
              l.city as city, l.province as province,
              l.address as location_address, l.postal_code as location_postal_code,
              l.phone as location_phone,
              sc.name as service_company_name, sc.phone as service_company_phone,
              sc.contact_name as service_company_contact,
              e.serial_number as equipment_serial_number
       FROM service_requests sr
       JOIN locations l ON l.id = sr.location_id
       LEFT JOIN service_companies sc ON sc.id = sr.service_company_id
       LEFT JOIN equipment e ON e.id = sr.equipment_id
       WHERE sr.id = ?`
    )
    .get(id) as ServiceRequestWithJoins | undefined;
}

export function listPartsForRequest(serviceRequestId: number): {
  part_id: number;
  part_number: string;
  description: string;
  quantity: number;
}[] {
  return db
    .prepare(
      `SELECT srp.part_id, p.part_number, p.description, srp.quantity
       FROM service_request_parts srp
       JOIN parts p ON p.id = srp.part_id
       WHERE srp.service_request_id = ?
       ORDER BY p.part_number`
    )
    .all(serviceRequestId) as {
    part_id: number;
    part_number: string;
    description: string;
    quantity: number;
  }[];
}

export function listRequestsForPart(partId: number): {
  id: number;
  quantity: number;
  status: string;
  created_at: string;
  location_name: string;
  store_number: string;
}[] {
  return db
    .prepare(
      `SELECT sr.id, srp.quantity, sr.status, sr.created_at, l.name as location_name, l.store_number
       FROM service_request_parts srp
       JOIN service_requests sr ON sr.id = srp.service_request_id
       JOIN locations l ON l.id = sr.location_id
       WHERE srp.part_id = ?
       ORDER BY sr.created_at DESC`
    )
    .all(partId) as {
    id: number;
    quantity: number;
    status: string;
    created_at: string;
    location_name: string;
    store_number: string;
  }[];
}

export const setPartsForRequest = db.transaction(
  (serviceRequestId: number, items: { part_id: number; quantity: number }[]) => {
    db.prepare("DELETE FROM service_request_parts WHERE service_request_id = ?").run(
      serviceRequestId
    );
    const insert = db.prepare(
      "INSERT INTO service_request_parts (service_request_id, part_id, quantity) VALUES (?, ?, ?)"
    );
    for (const item of items) {
      if (!item.part_id || item.quantity <= 0) continue;
      insert.run(serviceRequestId, item.part_id, item.quantity);
    }
  }
);

export function createServiceRequest(input: {
  location_id: number;
  service_company_id?: number | null;
  equipment_id?: number | null;
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
        (location_id, service_company_id, equipment_id, status, priority, equipment_description, issue_description, reported_by, scheduled_at)
       VALUES (@location_id, @service_company_id, @equipment_id, @status, @priority, @equipment_description, @issue_description, @reported_by, @scheduled_at)`
    )
    .run({
      service_company_id: null,
      equipment_id: null,
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
    totalLocations: totalLocations.c,
    recentRequests,
  };
}
