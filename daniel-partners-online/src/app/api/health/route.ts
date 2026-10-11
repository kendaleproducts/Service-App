import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export function GET() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM services").get() as { n: number };
  return NextResponse.json({ ok: true, services: row.n }, { headers: { "Cache-Control": "no-store" } });
}
