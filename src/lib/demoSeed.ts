import { db } from "./db";
import type { Location } from "./types";

const FRYER_PARTS = [
  { part_number: "BPF-LID-GSKT", description: "Pressure fryer lid gasket/seal kit" },
  { part_number: "BPF-LID-SW", description: "Pressure lid interlock safety switch" },
  { part_number: "BPF-PRV-100", description: "Pressure relief valve assembly" },
  { part_number: "BPF-TSTAT", description: "Digital temperature probe / thermostat" },
  { part_number: "BPF-TIMER-CTRL", description: "Cook cycle timer control board" },
  { part_number: "BPF-BASKET-SOL", description: "Basket auto-lift solenoid" },
  { part_number: "BPF-HTR-ELEM", description: "Pressure fryer heating element, 220V" },
  { part_number: "BPF-DOOR-HINGE", description: "Lid hinge pin & bushing kit" },
];

const SCENARIOS: {
  status: string;
  priority: string;
  equipment_description: string;
  issue_description: string;
  reported_by: string;
  notes: string[];
  ship?: string;
}[] = [
  {
    status: "In Progress",
    priority: "Urgent",
    equipment_description: "Broaster electric pressure fryer — unit #1",
    issue_description:
      "Pressure lid will not lock — interlock switch appears failed. Fryer inoperable, unit down.",
    reported_by: "Store Manager",
    notes: [
      "Dispatched Kendale service, tech on site within 4 hours.",
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

function ensureFryerParts(): Record<string, number> {
  const findByNumber = db.prepare("SELECT id FROM parts WHERE part_number = ?");
  const insert = db.prepare(
    `INSERT INTO parts (part_number, description)
     VALUES (@part_number, @description)`
  );

  const ids: Record<string, number> = {};
  for (const p of FRYER_PARTS) {
    const existing = findByNumber.get(p.part_number) as { id: number } | undefined;
    ids[p.part_number] = existing ? existing.id : Number(insert.run(p).lastInsertRowid);
  }
  return ids;
}

function ensureFryerServiceCompany(): number {
  const kendale = db
    .prepare("SELECT id FROM service_companies WHERE name LIKE '%Kendale%'")
    .get() as { id: number } | undefined;
  if (kendale) return kendale.id;

  // Prefer a real imported company over fabricating one, if any exist.
  const anyReal = db
    .prepare("SELECT id FROM service_companies ORDER BY id LIMIT 1")
    .get() as { id: number } | undefined;
  if (anyReal) return anyReal.id;

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
  return Number(info.lastInsertRowid);
}

function pickDiverseLocations(limit: number): Location[] {
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
    .all(limit) as Location[];
}

export interface DemoSeedResult {
  ok: boolean;
  message: string;
}

export function seedFryerDemo(): DemoSeedResult {
  const locationCount = (
    db.prepare("SELECT COUNT(*) as c FROM locations").get() as { c: number }
  ).c;
  if (locationCount === 0) {
    return {
      ok: false,
      message:
        "No locations found. Import the real spreadsheet first (Locations → Import from Excel), then try again.",
    };
  }

  const alreadySeeded =
    (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM service_requests WHERE equipment_description LIKE '%pressure fryer%'"
        )
        .get() as { c: number }
    ).c > 0;
  if (alreadySeeded) {
    return { ok: true, message: "Demo data is already loaded — nothing to do." };
  }

  const partIds = ensureFryerParts();
  const companyId = ensureFryerServiceCompany();
  const locations = pickDiverseLocations(5);

  if (locations.length === 0) {
    return { ok: false, message: "No open locations found to attach demo requests to." };
  }

  const insertRequest = db.prepare(
    `INSERT INTO service_requests
      (location_id, service_company_id, status, priority, equipment_description, issue_description, reported_by)
     VALUES (@location_id, @service_company_id, @status, @priority, @equipment_description, @issue_description, @reported_by)`
  );
  const insertNote = db.prepare(
    "INSERT INTO service_request_notes (service_request_id, note) VALUES (?, ?)"
  );

  const seedTransaction = db.transaction(() => {
    SCENARIOS.forEach((scenario, i) => {
      const location = locations[i % locations.length];
      const reqId = Number(
        insertRequest.run({
          location_id: location.id,
          service_company_id: companyId,
          status: scenario.status,
          priority: scenario.priority,
          equipment_description: scenario.equipment_description,
          issue_description: scenario.issue_description,
          reported_by: scenario.reported_by,
        }).lastInsertRowid
      );

      for (const note of scenario.notes) {
        insertNote.run(reqId, note);
      }

      if (scenario.ship) {
        db.prepare(
          "INSERT INTO service_request_parts (service_request_id, part_id, quantity) VALUES (?, ?, 1)"
        ).run(reqId, partIds[scenario.ship]);
      }
    });
  });
  seedTransaction();

  return {
    ok: true,
    message: `Loaded demo data: ${FRYER_PARTS.length} parts, 1 service company, ${SCENARIOS.length} service requests.`,
  };
}
