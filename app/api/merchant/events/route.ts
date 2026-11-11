import { NextResponse } from "next/server";
import { fail, readJson } from "@/lib/http";
import { authMerchant, createEvent, deleteEvent } from "@/lib/merchants";

export async function POST(req: Request) {
  const m = await authMerchant(req);
  if (!m) return fail("Please sign in again.", 401);
  const ev = await createEvent(m, await readJson(req));
  if ("error" in ev) return fail(ev.error, 422);
  return NextResponse.json({ event: ev });
}

export async function DELETE(req: Request) {
  const m = await authMerchant(req);
  if (!m) return fail("Please sign in again.", 401);
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!(await deleteEvent(m, slug))) return fail("That event is not yours to delete.", 404);
  return NextResponse.json({ deleted: slug });
}
