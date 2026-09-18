import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
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
