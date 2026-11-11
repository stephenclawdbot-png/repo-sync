import { NextResponse } from "next/server";
import { checkInStatus } from "@/lib/core";
import { getEvent } from "@/lib/events";
import { verifyTicket } from "@/lib/token";

export async function GET(req: Request) {
  const claims = verifyTicket(new URL(req.url).searchParams.get("token") ?? "");
  const ev = claims && getEvent(claims.e);
  if (!claims || !ev) return NextResponse.json({ valid: false });
  const status = await checkInStatus(ev, claims.i);
  return NextResponse.json({ valid: true, checkedIn: Boolean(status), serial: status?.serial });
}
