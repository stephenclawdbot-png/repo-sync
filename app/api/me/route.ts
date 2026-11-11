import { findEvent } from "@/lib/merchants";
import { NextResponse } from "next/server";
import { checkInStatus, existingTicket, ledger } from "@/lib/core";
import { EVENTS, tierLabel } from "@/lib/events";
import { fail, readJson } from "@/lib/http";
import { isId, verifyTicket } from "@/lib/token";

export async function POST(req: Request) {
  const body = await readJson<{ gid: string; tokens: string[] }>(req);
  if (!body || !isId(body.gid)) return fail("Missing guest id.");

  const tickets = (
    await Promise.all(
      (Array.isArray(body.tokens) ? body.tokens : []).slice(0, 30).map(async (token) => {
        const c = verifyTicket(String(token));
        const ev = c && (await findEvent(c.e));
        if (!c || !ev) return null;
        const [held, scanned] = await Promise.all([existingTicket(ev, c.g), checkInStatus(ev, c.i)]);
        const state = scanned ? "stub" : held?.tid === c.i ? "ticket" : "cancelled";
        return {
          token,
          slug: ev.slug,
          state,
          serial: scanned?.serial,
          name: c.n,
          tier: tierLabel(ev, held?.tier ?? c.t),
          via: held?.via ?? c.v,
          admits: held?.admits ?? c.q,
          startsAt: ev.startsAt,
          org: ev.org,
          hasEarn: Boolean(ev.earn),
          event: { title: ev.title, kind: ev.kind, dateLabel: ev.dateLabel, venue: ev.venue, design: ev.design },
        };
      }),
    )
  ).filter(Boolean);

  const orgs = [
    ...new Map(
      [...EVENTS.filter((e) => e.earn).map((e) => e.org), ...tickets.filter((t) => t?.hasEarn).map((t) => t!.org)].map((o) => [o.id, o]),
    ).values(),
  ];
  const points = await Promise.all(orgs.map(async (o) => ({ org: o.name, balance: (await ledger(o.id, body.gid)).balance })));

  return NextResponse.json({ tickets, points: points.filter((p) => p.balance !== 0) });
}
