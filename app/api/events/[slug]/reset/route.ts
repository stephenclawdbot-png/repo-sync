import { NextResponse } from "next/server";
import { resetEvent } from "@/lib/core";
import { getEvent } from "@/lib/events";
import { fail, readJson } from "@/lib/http";

/** Clears demo activity for one event (tickets, RSVPs, scans, and its organizer's points). */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const ev = getEvent((await ctx.params).slug);
  const body = await readJson<{ door: string }>(req);
  if (!ev) return fail("Unknown event.", 404);
  if (body?.door !== ev.doorCode) return fail("Wrong door code.", 401);
  return NextResponse.json({ removed: await resetEvent(ev) });
}
