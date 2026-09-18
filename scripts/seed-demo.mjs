// Populates the database with realistic demo data for testing and sales
// demos: a few service companies, parts (including one low-stock item),
// service requests across different statuses/priorities, a timeline note,
// and a shipment. Safe to re-run — each section only inserts if empty.
//
// Usage: npm run seed:demo

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "app.db"));
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(process.cwd(), "src", "lib", "schema.sql"), "utf-8"));

function getOrCreateCustomer(name) {
  const existing = db.prepare("SELECT * FROM customers WHERE name = ?").get(name);
  if (existing) return existing;
  const info = db.prepare("INSERT INTO customers (name) VALUES (?)").run(name);
  return db.prepare("SELECT * FROM customers WHERE id = ?").get(info.lastInsertRowid);
}

function ensureLocations(customerId) {
  const count = db.prepare("SELECT COUNT(*) as c FROM locations").get().c;
  if (count > 0) return;

  const seedLocations = [
    { store_number: "1001", name: "Millbrook Mall", city: "Corner Brook", province: "NL" },
    { store_number: "1010", name: "Avalon Mall", city: "St. John's", province: "NL" },
    { store_number: "3050", name: "Yonge & Eglinton", city: "Toronto", province: "ON" },
    { store_number: "4020", name: "Polo Park", city: "Winnipeg", province: "MB" },
    { store_number: "5015", name: "Chinook Centre", city: "Calgary", province: "AB" },
    { store_number: "6005", name: "Metrotown", city: "Burnaby", province: "BC" },
  ];

  const insert = db.prepare(
    `INSERT INTO locations (customer_id, store_number, name, ownership, status, city, province)
     VALUES (@customer_id, @store_number, @name, 'Franchise', 'Open', @city, @province)`
  );
  for (const loc of seedLocations) {
    insert.run({ customer_id: customerId, ...loc });
  }
}

function ensureCompanies() {
  const count = db.prepare("SELECT COUNT(*) as c FROM service_companies").get().c;
  if (count > 0) return;

  const companies = [
    {
      name: "Atlantic Kitchen Repair Inc.",
      contact_name: "Dave Sheppard",
      phone: "709-555-0142",
      email: "dave@atlantickitchenrepair.example",
      coverage_area: "Newfoundland & Labrador",
    },
    {
      name: "Prairie Commercial Appliance",
      contact_name: "Lena Voth",
      phone: "204-555-0198",
      email: "lena@prairieappliance.example",
      coverage_area: "Manitoba & Saskatchewan",
    },
    {
      name: "Western Foodservice Techs",
      contact_name: "Marcus Yee",
      phone: "604-555-0110",
      email: "marcus@westernfoodservice.example",
      coverage_area: "BC & Alberta",
    },
  ];

  const insert = db.prepare(
    `INSERT INTO service_companies (name, contact_name, phone, email, coverage_area)
     VALUES (@name, @contact_name, @phone, @email, @coverage_area)`
  );
  for (const c of companies) insert.run(c);
}

function ensureParts() {
  const count = db.prepare("SELECT COUNT(*) as c FROM parts").get().c;
  if (count > 0) return;

  const parts = [
    {
      part_number: "FRY-THRM-100",
      description: "Fryer thermostat, universal",
      quantity_on_hand: 2,
      reorder_threshold: 5,
      unit_cost: 45.99,
    },
    {
      part_number: "WRM-HTEL-220",
      description: "Holding cabinet heating element, 220V",
      quantity_on_hand: 8,
      reorder_threshold: 3,
      unit_cost: 89.5,
    },
    {
      part_number: "OVN-DOOR-SEAL",
      description: "Convection oven door gasket seal",
      quantity_on_hand: 14,
      reorder_threshold: 4,
      unit_cost: 22.0,
    },
    {
      part_number: "FRZ-COMP-500",
      description: "Reach-in freezer compressor, 1/2 HP",
      quantity_on_hand: 1,
      reorder_threshold: 2,
      unit_cost: 310.0,
    },
  ];

  const insert = db.prepare(
    `INSERT INTO parts (part_number, description, quantity_on_hand, reorder_threshold, unit_cost)
     VALUES (@part_number, @description, @quantity_on_hand, @reorder_threshold, @unit_cost)`
  );
  for (const p of parts) insert.run(p);
}

function ensureServiceRequests() {
  const count = db.prepare("SELECT COUNT(*) as c FROM service_requests").get().c;
  if (count > 0) return;

  const locationByStore = (storeNumber) =>
    db.prepare("SELECT * FROM locations WHERE store_number = ?").get(storeNumber);
  const companyByName = (fragment) =>
    db.prepare("SELECT * FROM service_companies WHERE name LIKE ?").get(`%${fragment}%`);
  const partByNumber = (partNumber) =>
    db.prepare("SELECT * FROM parts WHERE part_number = ?").get(partNumber);

  const atlantic = companyByName("Atlantic");
  const prairie = companyByName("Prairie");
  const western = companyByName("Western");
  const fryerThermostat = partByNumber("FRY-THRM-100");

  const insertRequest = db.prepare(
    `INSERT INTO service_requests
      (location_id, service_company_id, status, priority, equipment_description, issue_description, reported_by)
     VALUES (@location_id, @service_company_id, @status, @priority, @equipment_description, @issue_description, @reported_by)`
  );

  const req1 = insertRequest.run({
    location_id: locationByStore("1001").id,
    service_company_id: atlantic.id,
    status: "In Progress",
    priority: "Urgent",
    equipment_description: "Fryer #2",
    issue_description: "Fryer not heating past 250°F — suspected thermostat failure",
    reported_by: "Store Manager",
  }).lastInsertRowid;

  const insertNote = db.prepare(
    "INSERT INTO service_request_notes (service_request_id, note) VALUES (?, ?)"
  );
  insertNote.run(req1, "Called Atlantic Kitchen Repair, technician scheduled for Thursday AM");
  insertNote.run(req1, "Technician confirmed thermostat failure, part ordered from Fort Erie");

  const shipmentId = db
    .prepare(
      `INSERT INTO part_shipments (service_request_id, location_id, carrier, tracking_number, status, shipped_at)
       VALUES (?, ?, 'Canada Post', 'CP123456789CA', 'Shipped', datetime('now'))`
    )
    .run(req1, locationByStore("1001").id).lastInsertRowid;
  db.prepare(
    "INSERT INTO part_shipment_items (part_shipment_id, part_id, quantity) VALUES (?, ?, 1)"
  ).run(shipmentId, fryerThermostat.id);
  db.prepare(
    "UPDATE parts SET quantity_on_hand = quantity_on_hand - 1 WHERE id = ?"
  ).run(fryerThermostat.id);

  insertRequest.run({
    location_id: locationByStore("4020").id,
    service_company_id: prairie.id,
    status: "Scheduled",
    priority: "Normal",
    equipment_description: "Holding cabinet",
    issue_description: "Heating element intermittent, cabinet not holding temperature overnight",
    reported_by: "Assistant Manager",
  });

  insertRequest.run({
    location_id: locationByStore("6005").id,
    service_company_id: western.id,
    status: "New",
    priority: "High",
    equipment_description: "Reach-in freezer",
    issue_description: "Freezer compressor making loud grinding noise, temp rising",
    reported_by: "Store Manager",
  });

  insertRequest.run({
    location_id: locationByStore("1010").id,
    service_company_id: atlantic.id,
    status: "Completed",
    priority: "Low",
    equipment_description: "Convection oven",
    issue_description: "Door seal worn, minor heat loss",
    reported_by: "Store Manager",
  });
}

const customer = getOrCreateCustomer("Mary Brown's");
ensureLocations(customer.id);
ensureCompanies();
ensureParts();
ensureServiceRequests();

console.log("Demo data ready:");
console.log(`  Locations: ${db.prepare("SELECT COUNT(*) as c FROM locations").get().c}`);
console.log(`  Service companies: ${db.prepare("SELECT COUNT(*) as c FROM service_companies").get().c}`);
console.log(`  Parts: ${db.prepare("SELECT COUNT(*) as c FROM parts").get().c}`);
console.log(`  Service requests: ${db.prepare("SELECT COUNT(*) as c FROM service_requests").get().c}`);
