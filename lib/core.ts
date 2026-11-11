/**
 * Server-side rules shared by every way in: issuing tickets, capacity, points, check-in.
 *
 * Record keys (see lib/store.ts):
 *   tix/<event>/<guest>~<ticket>~<via>~<tier>~<admits>
 *   rsvp/<event>/<guest>~<status>~<admits>~<answers>
 *   wait/<event>/<guest>~<timestamp>
 *   in/<event>/<ticket>~<serial>~<timestamp>~<admits>
 *   ref/<event>/<friend>~<referrer>
 *   pts/<org>/<guest>/<quest>~<ref>~<amount>
 *   perk/<event>/<guest>~<reward>
 */
import type { EventDef, QuestId, Via } from "./events";
import { fields, store } from "./store";
import { newId, signTicket, type TicketClaims } from "./token";

export interface Counts {
  going: number;
  maybe: number;
  waitlist: number;
  checkedIn: number;
  scans: number;
  spotsLeft: number;
  byVia: Record<Via, number>;
}

export async function counts(ev: EventDef): Promise<Counts> {
  const [tix, rsvps, ins, wait] = await Promise.all([
    store.list(`tix/${ev.slug}/`),
    store.list(`rsvp/${ev.slug}/`),
    store.list(`in/${ev.slug}/`),
    store.list(`wait/${ev.slug}/`),
  ]);
  const byVia: Record<Via, number> = { rsvp: 0, buy: 0, earn: 0 };
  byVia[ev.rsvp ? "rsvp" : "buy"] += ev.seeded.going;
  for (const k of tix) {
    const [, , via, , admits] = fields(k);
    byVia[via as Via] += Number(admits);
  }
  const going = byVia.rsvp + byVia.buy + byVia.earn;
  return {
    going,
    maybe: ev.seeded.maybe + rsvps.filter((k) => fields(k)[1] === "maybe").length,
    waitlist: wait.length,
    checkedIn: ev.seeded.checkedIn + ins.reduce((n, k) => n + Number(fields(k)[3] ?? 1), 0),
    scans: ins.length,
    spotsLeft: Math.max(0, ev.capacity - going),
    byVia,
  };
}

export interface Issue {
  gid: string;
  name: string;
  via: Via;
  tier: string;
  admits: number;
  /** Replace a ticket the guest already holds (e.g. a new purchase or a changed plus-one count). */
  replace?: boolean;
}

export async function existingTicket(ev: EventDef, gid: string) {
  const [key] = await store.list(`tix/${ev.slug}/${gid}~`);
  if (!key) return null;
  const [, tid, via, tier, admits] = fields(key);
  return { tid, via: via as Via, tier, admits: Number(admits) };
}

export async function issueTicket(ev: EventDef, req: Issue): Promise<string> {
  const held = await existingTicket(ev, req.gid);
  if (held && !req.replace) {
    return signTicket({ i: held.tid, e: ev.slug, t: held.tier, n: req.name, g: req.gid, v: held.via, q: held.admits });
  }
  // A replaced ticket keeps its id so a QR already saved to a phone or wallet stays valid.
  const tid = held?.tid ?? newId(10);
  if (held) await store.remove(`tix/${ev.slug}/${req.gid}~`);
  await store.put(`tix/${ev.slug}/${req.gid}~${tid}~${req.via}~${req.tier}~${req.admits}`);
  return signTicket({ i: tid, e: ev.slug, t: req.tier, n: req.name, g: req.gid, v: req.via, q: req.admits });
}

export async function cancelTicket(ev: EventDef, gid: string) {
  await store.remove(`tix/${ev.slug}/${gid}~`);
}

/* ---------- points ---------- */

export interface PointEntry {
  quest: string;
  ref: string;
  amount: number;
}

export async function ledger(org: string, gid: string): Promise<{ balance: number; entries: PointEntry[] }> {
  const keys = await store.list(`pts/${org}/${gid}/`);
  const entries = keys.map((k) => {
    const [quest, ref, amount] = fields(k);
    return { quest, ref, amount: Number(amount) };
  });
  return { balance: entries.reduce((n, e) => n + e.amount, 0), entries };
}

/** Idempotent: the same quest + ref can only ever be credited once. */
export async function award(org: string, gid: string, quest: QuestId | "redeem", ref: string, amount: number) {
  await store.put(`pts/${org}/${gid}/${quest}~${ref}~${amount}`);
}

export function questPoints(ev: EventDef, id: QuestId): number {
  return ev.earn?.quests.find((q) => q.id === id)?.points ?? 0;
}

export async function recordReferral(ev: EventDef, friend: string, referrer: string | undefined) {
  if (!ev.earn || !referrer || referrer === friend || !questPoints(ev, "refer")) return;
  const already = await store.list(`ref/${ev.slug}/${friend}~`);
  if (!already.length) await store.put(`ref/${ev.slug}/${friend}~${referrer}`);
}

export async function earnState(ev: EventDef, gid: string) {
  const [{ balance, entries }, refs, perks, tix] = await Promise.all([
    ledger(ev.org.id, gid),
    store.list(`ref/${ev.slug}/`),
    store.list(`perk/${ev.slug}/${gid}~`),
    store.list(`tix/${ev.slug}/`),
  ]);
  const invited = refs.filter((k) => fields(k)[1] === gid).length;
  const confirmed = entries.filter((e) => e.quest === "refer" && e.ref.startsWith(`${ev.slug}.`)).length;
  const earnedTickets = tix.filter((k) => fields(k)[2] === "earn").length;
  return {
    balance,
    joined: entries.some((e) => e.quest === "join" && e.ref === ev.slug),
    shownUp: entries.some((e) => e.quest === "showup" && e.ref === ev.slug),
    invited,
    confirmed,
    pending: Math.max(0, invited - confirmed),
    redeemed: [
      ...entries.filter((e) => e.quest === "redeem" && e.ref.startsWith(`${ev.slug}.`)).map((e) => e.ref.split(".")[1]),
      ...perks.map((k) => fields(k)[1]),
    ],
    ticketsLeft: Math.max(0, (ev.earn?.ticketBudget ?? 0) - earnedTickets),
  };
}

/* ---------- check-in ---------- */

export type CheckIn =
  | { result: "ok"; serial: number; name: string; tier: string; admits: number; via: Via }
  | { result: "already"; serial: number; at: number; name: string }
  | { result: "wrong-event" | "cancelled" };

export async function checkInStatus(ev: EventDef, tid: string) {
  const [key] = await store.list(`in/${ev.slug}/${tid}~`);
  if (!key) return null;
  const [, serial, at] = fields(key);
  return { serial: Number(serial), at: Number(at) };
}

export async function checkIn(ev: EventDef, c: TicketClaims): Promise<CheckIn> {
  if (c.e !== ev.slug) return { result: "wrong-event" };
  const held = await existingTicket(ev, c.g);
  if (!held || held.tid !== c.i) return { result: "cancelled" };

  const prior = await checkInStatus(ev, c.i);
  if (prior) return { result: "already", serial: prior.serial, at: prior.at, name: c.n };

  const scanned = await store.list(`in/${ev.slug}/`);
  const serial = ev.seeded.checkedIn + scanned.length + 1;
  await store.put(`in/${ev.slug}/${c.i}~${serial}~${Date.now()}~${held.admits}`);

  if (ev.earn) {
    const showup = questPoints(ev, "showup");
    if (showup) await award(ev.org.id, c.g, "showup", ev.slug, showup);
    const [ref] = await store.list(`ref/${ev.slug}/${c.g}~`);
    if (ref) await award(ev.org.id, fields(ref)[1], "refer", `${ev.slug}.${c.g}`, questPoints(ev, "refer"));
  }
  return { result: "ok", serial, name: c.n, tier: held.tier, admits: held.admits, via: held.via };
}

export async function resetEvent(ev: EventDef) {
  const removed = await Promise.all(
    [...["tix", "rsvp", "wait", "in", "ref", "perk"].map((p) => `${p}/${ev.slug}/`), `pts/${ev.org.id}/`].map((p) =>
      store.remove(p),
    ),
  );
  return removed.reduce((a, b) => a + b, 0);
}
