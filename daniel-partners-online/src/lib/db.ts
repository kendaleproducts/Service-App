import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "@/lib/seed";

export const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
export const uploadsDir = path.join(dataDir, "uploads");

for (const dir of [dataDir, uploadsDir]) {
  // Runtime-only paths; the ignore comments stop Turbopack tracing the whole project.
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
}

const dbPath = path.join(dataDir, "online.db");

declare global {
  var __dpoDb: Database.Database | undefined;
}

function createConnection() {
  const conn = new Database(dbPath);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  // `next build` imports every route module across parallel workers, which
  // opens this file concurrently. Wait instead of failing with SQLITE_BUSY.
  conn.pragma("busy_timeout = 10000");
  const schema = fs.readFileSync(path.join(process.cwd(), "src", "lib", "schema.sql"), "utf-8");
  conn.exec(schema);
  seedIfEmpty(conn);
  return conn;
}

export const db = global.__dpoDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  global.__dpoDb = db;
}
