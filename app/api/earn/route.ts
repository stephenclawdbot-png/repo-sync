import { NextResponse } from "next/server";
import { award, earnState, questPoints, recordReferral } from "@/lib/core";
import { getEvent } from "@/lib/events";
import { fail, readJson } from "@/lib/http";
import { isId } from "@/lib/token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ev = getEvent(url.searchParams.get("slug") ?? "");
  const gid = url.searchParams.get("gid");
  if (!ev?.earn) return fail("This event has no rewards.", 404);
  if (!isId(gid)) return fail("Missing guest id.");
  return NextResponse.json(await earnState(ev, gid));
}

/** Join the crew: no ticket yet, but you can start earning toward one. */
export async function POST(req: Request) {
  const body = await readJson<{ slug: string; gid: string; ref?: string }>(req);
  const ev = body && getEvent(body.slug);
  if (!body || !ev?.earn) return fail("This event has no rewards.", 404);
  if (!isId(body.gid)) return fail("Missing guest id.");
  const join = questPoints(ev, "join");
  if (join) await award(ev.org.id, body.gid, "join", ev.slug, join);
  await recordReferral(ev, body.gid, isId(body.ref) ? body.ref : undefined);
  return NextResponse.json(await earnState(ev, body.gid));
}
