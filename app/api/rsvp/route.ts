import { NextResponse } from "next/server";
import { award, cancelTicket, counts, existingTicket, issueTicket, questPoints, recordReferral } from "@/lib/core";
import { findEvent } from "@/lib/merchants";
import { clampInt, fail, readJson } from "@/lib/http";
import { fields, store } from "@/lib/store";
import { cleanName, isId } from "@/lib/token";

interface Body {
  slug: string;
  gid: string;
  name: string;
  status: "going" | "maybe" | "declined";
  plusOnes?: number;
  answers?: number[];
  ref?: string;
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  const ev = body && (await findEvent(body.slug));
  if (!body || !ev || !ev.rsvp) return fail("This event does not take RSVPs.", 404);
  if (ev.past) return fail("This event has ended.", 410);
  if (!isId(body.gid)) return fail("Missing guest id.");
  if (!["going", "maybe", "declined"].includes(body.status)) return fail("Choose Going, Maybe or Can't go.");
  const name = cleanName(body.name);
  if (!name && body.status !== "declined") return fail("Please tell the host your name.");

  const admits = 1 + clampInt(body.plusOnes, 0, ev.plusOnesMax);
  const answers =
    ev.questions.map((q, i) => clampInt(body.answers?.[i], 0, q.options.length - 1)).join(".") || "x";
  const rsvpPrefix = `rsvp/${ev.slug}/${body.gid}~`;
  const held = await existingTicket(ev, body.gid);

  if (body.status !== "going") {
    await store.remove(rsvpPrefix);
    await store.put(`${rsvpPrefix}${body.status}~${admits}~${answers}`);
    await store.remove(`wait/${ev.slug}/${body.gid}~`);
    if (held?.via === "rsvp") await cancelTicket(ev, body.gid);
    return NextResponse.json({ status: body.status });
  }

  const c = await counts(ev);
  const extra = admits - (held?.admits ?? 0);
  if (extra > c.spotsLeft) {
    const mine = `wait/${ev.slug}/${body.gid}~`;
    if (!(await store.list(mine)).length) await store.put(`${mine}${Date.now()}`);
    const queue = (await store.list(`wait/${ev.slug}/`)).sort((a, b) => Number(fields(a)[1]) - Number(fields(b)[1]));
    return NextResponse.json({
      status: "waitlisted",
      position: queue.findIndex((k) => k.startsWith(mine)) + 1,
      spotsLeft: c.spotsLeft,
    });
  }

  await store.remove(rsvpPrefix);
  await store.put(`${rsvpPrefix}going~${admits}~${answers}`);
  await store.remove(`wait/${ev.slug}/${body.gid}~`);
  const token = await issueTicket(ev, {
    gid: body.gid,
    name,
    via: "rsvp",
    tier: "list",
    admits,
    replace: Boolean(held && held.via === "rsvp" && held.admits !== admits),
  });

  let earned = 0;
  if (ev.earn) {
    earned = held ? 0 : questPoints(ev, "join");
    if (questPoints(ev, "join")) await award(ev.org.id, body.gid, "join", ev.slug, questPoints(ev, "join"));
    await recordReferral(ev, body.gid, isId(body.ref) ? body.ref : undefined);
  }
  return NextResponse.json({ status: "going", token, admits, earned });
}
