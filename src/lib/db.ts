import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");

declare global {
  var __db: Database.Database | undefined;
}

function createConnection() {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db = global.__db ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

const schemaPath = path.join(process.cwd(), "src", "lib", "schema.sql");
db.exec(fs.readFileSync(schemaPath, "utf-8"));

// Lightweight migrations for columns added after a database already exists
// (CREATE TABLE IF NOT EXISTS above only helps brand-new databases).
function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing("service_companies", "address", "TEXT");
addColumnIfMissing("service_companies", "city", "TEXT");
addColumnIfMissing("service_companies", "province", "TEXT");
addColumnIfMissing("service_companies", "postal_code", "TEXT");
addColumnIfMissing("service_companies", "country", "TEXT");
addColumnIfMissing("service_companies", "latitude", "REAL");
addColumnIfMissing("service_companies", "longitude", "REAL");
