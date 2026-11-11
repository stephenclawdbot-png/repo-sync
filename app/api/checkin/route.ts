import { findEvent } from "@/lib/merchants";
import { NextResponse } from "next/server";
import { checkIn } from "@/lib/core";
import { tierLabel } from "@/lib/events";
import { fail, readJson } from "@/lib/http";
import { verifyTicket } from "@/lib/token";

export async function POST(req: Request) {
  const body = await readJson<{ slug: string; code: string; door: string }>(req);
  const ev = body && (await findEvent(body.slug));
  if (!body || !ev) return fail("Unknown event.", 404);
  if (String(body.door) !== ev.doorCode) return fail("Wrong door code.", 401);

  const claims = verifyTicket(String(body.code ?? ""));
  if (!claims) return NextResponse.json({ result: "invalid" });

  const res = await checkIn(ev, claims);
  if (res.result === "ok") return NextResponse.json({ ...res, tier: tierLabel(ev, res.tier) });
  return NextResponse.json(res);
}
