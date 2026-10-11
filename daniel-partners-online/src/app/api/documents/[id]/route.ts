import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadsDir } from "@/lib/db";
import { getDocument, getMatter } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Sign in required", { status: 401 });
  const doc = getDocument(Number(id));
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const matter = getMatter(doc.matter_id);
  if (!matter) return new NextResponse("Not found", { status: 404 });
  if (user.role === "client" && matter.client_id !== user.id) return new NextResponse("Not found", { status: 404 });

  const safeName = doc.name.replace(/[^\w.\- ]/g, "_");
  const headers = {
    "Content-Type": doc.mime_type,
    "Content-Disposition": `${doc.mime_type.startsWith("text/") ? "inline" : "attachment"}; filename="${safeName}"`,
    "Cache-Control": "private, no-store",
  };
  if (doc.stored_name) {
    const file = await fs.readFile(path.join(uploadsDir, path.basename(doc.stored_name)));
    return new NextResponse(new Uint8Array(file), { headers });
  }
  return new NextResponse(doc.content ?? "", { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
}
