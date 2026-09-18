// Layers a pressure-fryer-focused demo on top of REAL imported location data:
// parts specific to electric pressure fryers (gaskets, interlock switches,
// relief valves, etc.) and service requests describing real pressure-fryer
// failure modes, spread across real locations in different provinces.
//
// Run "Locations -> Import from Excel" (or the app's importer) FIRST so real
// stores exist — this script does not create fake locations.
//
// Usage: npm run seed:fryers

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

const locationCount = db.prepare("SELECT COUNT(*) as c FROM locations").get().c;
if (locationCount === 0) {
  console.error(
    "No locations found. Import the real spreadsheet first (Locations -> Import from Excel), then re-run this script."
  );
  process.exit(1);
}

function ensureFryerParts() {
  const parts = [
    {
      part_number: "BPF-LID-GSKT",
      description: "Pressure fryer lid gasket/seal kit",
      quantity_on_hand: 3,
      reorder_threshold: 6,
      unit_cost: 38.5,
    },
    {
      part_number: "BPF-LID-SW",
      description: "Pressure lid interlock safety switch",
      quantity_on_hand: 5,
      reorder_threshold: 4,
      unit_cost: 64.0,
    },
    {
      part_number: "BPF-PRV-100",
      description: "Pressure relief valve assembly",
      quantity_on_hand: 2,
      reorder_threshold: 3,
      unit_cost: 92.75,
    },
    {
      part_number: "BPF-TSTAT",
      description: "Digital temperature probe / thermostat",
      quantity_on_hand: 7,
      reorder_threshold: 4,
      unit_cost: 71.2,
    },
    {
      part_number: "BPF-TIMER-CTRL",
      description: "Cook cycle timer control board",
      quantity_on_hand: 4,
      reorder_threshold: 3,
      unit_cost: 215.0,
    },
    {
      part_number: "BPF-BASKET-SOL",
      description: "Basket auto-lift solenoid",
      quantity_on_hand: 6,
      reorder_threshold: 3,
      unit_cost: 58.3,
    },
    {
      part_number: "BPF-HTR-ELEM",
      description: "Pressure fryer heating element, 220V",
      quantity_on_hand: 3,
      reorder_threshold: 4,
      unit_cost: 134.0,
    },
    {
      part_number: "BPF-DOOR-HINGE",
      description: "Lid hinge pin & bushing kit",
      quantity_on_hand: 10,
      reorder_threshold: 5,
      unit_cost: 19.95,
    },
  ];

  const findByNumber = db.prepare("SELECT id FROM parts WHERE part_number = ?");
  const insert = db.prepare(
    `INSERT INTO parts (part_number, description, quantity_on_hand, reorder_threshold, unit_cost)
     VALUES (@part_number, @description, @quantity_on_hand, @reorder_threshold, @unit_cost)`
  );

  const ids = {};
  for (const p of parts) {
    const existing = findByNumber.get(p.part_number);
    ids[p.part_number] = existing ? existing.id : insert.run(p).lastInsertRowid;
  }
  return ids;
}

function ensureFryerServiceCompany() {
  const existing = db
    .prepare("SELECT * FROM service_companies WHERE name LIKE '%Kendale%'")
    .get();
  if (existing) return existing.id;

  const info = db
    .prepare(
      `INSERT INTO service_companies (name, contact_name, phone, email, coverage_area, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      "Kendale Products Limited",
      "Service Dispatch",
      "1-888-887-9923",
      "service@kendale.ca",
      "Canada-wide",
      "Coordinates all Mary Brown's service calls from Fort Erie, ON and dispatches technicians as needed."
    );
  return info.lastInsertRowid;
}

function pickDiverseLocations(limit) {
  return db
    .prepare(
      `SELECT l.* FROM locations l
       JOIN (
         SELECT province, MIN(id) as id
         FROM locations
         WHERE status = 'Open'
         GROUP BY province
       ) picked ON picked.id = l.id
       ORDER BY l.province
       LIMIT ?`
    )
    .all(limit);
}

function alreadySeeded() {
  return (
    db
      .prepare("SELECT COUNT(*) as c FROM service_requests WHERE equipment_description LIKE '%pressure fryer%'")
      .get().c > 0
  );
}

if (alreadySeeded()) {
  console.log("Pressure fryer demo data already present — skipping service requests.");
  process.exit(0);
}

const partIds = ensureFryerParts();
const companyId = ensureFryerServiceCompany();
const locations = pickDiverseLocations(5);

if (locations.length === 0) {
  console.error("No open locations found to attach demo requests to.");
  process.exit(1);
}

const insertRequest = db.prepare(
  `INSERT INTO service_requests
    (location_id, service_company_id, status, priority, equipment_description, issue_description, reported_by)
   VALUES (@location_id, @service_company_id, @status, @priority, @equipment_description, @issue_description, @reported_by)`
);
const insertNote = db.prepare(
  "INSERT INTO service_request_notes (service_request_id, note) VALUES (?, ?)"
);

const scenarios = [
  {
    status: "In Progress",
    priority: "Urgent",
    equipment_description: "Broaster electric pressure fryer — unit #1",
    issue_description:
      "Pressure lid will not lock — interlock switch appears failed. Fryer inoperable, unit down.",
    reported_by: "Store Manager",
    notes: [
      "Dispatched Broaster Factory-Certified Service, tech on site within 4 hours.",
      "Confirmed lid interlock switch failure. Replacement part requested from Fort Erie.",
    ],
    ship: "BPF-LID-SW",
  },
  {
    status: "Scheduled",
    priority: "High",
    equipment_description: "Broaster electric pressure fryer — unit #2",
    issue_description:
      "Losing pressure mid-cook cycle, lid gasket appears worn and cracked around the seal.",
    reported_by: "Assistant Manager",
    notes: ["Tech scheduled for next-day visit; gasket kit pulled from Fort Erie stock."],
  },
  {
    status: "New",
    priority: "Urgent",
    equipment_description: "Broaster electric pressure fryer — unit #1",
    issue_description:
      "Chicken coming out undercooked — fryer not reaching full pressure. Suspect pressure relief valve stuck open.",
    reported_by: "Store Manager",
    notes: [],
  },
  {
    status: "New",
    priority: "Normal",
    equipment_description: "Broaster electric pressure fryer — unit #3",
    issue_description: "Cook cycle timer board freezing partway through, cycles not completing.",
    reported_by: "Kitchen Lead",
    notes: [],
  },
  {
    status: "Completed",
    priority: "Normal",
    equipment_description: "Broaster electric pressure fryer — unit #2",
    issue_description: "Basket auto-lift motor grinding, intermittent failure to lift on cycle end.",
    reported_by: "Store Manager",
    notes: ["Solenoid replaced on site, tested through 3 full cook cycles — resolved."],
  },
];

scenarios.forEach((scenario, i) => {
  const location = locations[i % locations.length];
  const reqId = insertRequest.run({
    location_id: location.id,
    service_company_id: companyId,
    status: scenario.status,
    priority: scenario.priority,
    equipment_description: scenario.equipment_description,
    issue_description: scenario.issue_description,
    reported_by: scenario.reported_by,
  }).lastInsertRowid;

  for (const note of scenario.notes) {
    insertNote.run(reqId, note);
  }

  if (scenario.ship) {
    const shipmentId = db
      .prepare(
        `INSERT INTO part_shipments (service_request_id, location_id, carrier, tracking_number, status, shipped_at)
         VALUES (?, ?, 'Purolator', 'PUR' || abs(random() % 900000000 + 100000000), 'Shipped', datetime('now'))`
      )
      .run(reqId, location.id).lastInsertRowid;
    db.prepare(
      "INSERT INTO part_shipment_items (part_shipment_id, part_id, quantity) VALUES (?, ?, 1)"
    ).run(shipmentId, partIds[scenario.ship]);
    db.prepare(
      "UPDATE parts SET quantity_on_hand = quantity_on_hand - 1 WHERE id = ?"
    ).run(partIds[scenario.ship]);
  }

  console.log(`Created request at #${location.store_number} ${location.name} (${location.province}): ${scenario.issue_description.slice(0, 60)}...`);
});

console.log("\nPressure fryer demo data ready.");
