import { NextResponse } from "next/server";
import { counts } from "@/lib/core";
import { fail, readJson } from "@/lib/http";
import { authMerchant, MAX_EVENTS, merchantEvents, saveMerchant } from "@/lib/merchants";

export async function GET(req: Request) {
  const m = await authMerchant(req);
  if (!m) return fail("Please sign in again.", 401);
  const events = await merchantEvents(m.mid);
  const withCounts = await Promise.all(events.map(async (e) => ({ ...e, counts: await counts(e) })));
  return NextResponse.json({ merchant: m, events: withCounts, maxEvents: MAX_EVENTS });
}

export async function PUT(req: Request) {
  const m = await authMerchant(req);
  if (!m) return fail("Please sign in again.", 401);
  const body = await readJson<{ name?: string; storefront?: unknown }>(req);
  if (!body) return fail("Invalid request.");
  return NextResponse.json({ merchant: await saveMerchant(m, body) });
}
