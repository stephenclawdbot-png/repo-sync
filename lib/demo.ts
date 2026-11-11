/** One-click demo accounts: a guest with history, and a merchant with a storefront and events. */
import { EVENTS, getEvent } from "./events";
import { createEvent, createMerchant, merchantKey, saveMerchant } from "./merchants";
import { store } from "./store";
import type { EventInput, Merchant } from "./storefront";
import { newId, signTicket } from "./token";

export interface GuestProfile {
  handle: string;
  city: string;
  since: string;
  demo: boolean;
}

const STUBS = [
  { slug: "bayfront-sunset-sessions", serial: 212, via: "buy", tier: "ga", admits: 1 },
  { slug: "build-night-13", serial: 17, via: "rsvp", tier: "list", admits: 1 },
  { slug: "sunday-run-club-nov", serial: 9, via: "rsvp", tier: "list", admits: 1 },
] as const;

const UPCOMING = [
  { slug: "sunday-run-club", admits: 2, answers: "1" },
  { slug: "kanto-night-market", admits: 3, answers: "1" },
  { slug: "lia-and-marco", admits: 2, answers: "1.1" },
] as const;

export async function seedDemoGuest() {
  const gid = newId(12);
  const name = "Mika Reyes";
  const friend = newId(12);
  const writes: Promise<void>[] = [];
  const tokens: string[] = [];

  for (const u of UPCOMING) {
    const tid = newId(10);
    writes.push(store.put(`tix/${u.slug}/${gid}~${tid}~rsvp~list~${u.admits}`), store.put(`rsvp/${u.slug}/${gid}~going~${u.admits}~${u.answers}`));
    tokens.push(signTicket({ i: tid, e: u.slug, t: "list", n: name, g: gid, v: "rsvp", q: u.admits }));
  }
  for (const s of STUBS) {
    const tid = newId(10);
    const at = new Date(getEvent(s.slug)!.startsAt).getTime() + 20 * 60e3;
    writes.push(store.put(`tix/${s.slug}/${gid}~${tid}~${s.via}~${s.tier}~${s.admits}`), store.put(`in/${s.slug}/${tid}~${s.serial}~${at}~${s.admits}`));
    tokens.push(signTicket({ i: tid, e: s.slug, t: s.tier, n: name, g: gid, v: s.via, q: s.admits }));
  }
  const points: [string, string, string, number][] = [
    ["bayfront", "showup", "bayfront-sunset-sessions", 100],
    ["bayfront", "join", "sunday-run-club-nov", 50],
    ["bayfront", "showup", "sunday-run-club-nov", 100],
    ["bayfront", "refer", `sunday-run-club-nov.${friend}`, 150],
    ["bayfront", "join", "sunday-run-club", 50],
    ["buildnight", "join", "build-night-13", 50],
    ["buildnight", "showup", "build-night-13", 100],
    ["kanto", "join", "kanto-night-market", 50],
  ];
  for (const [org, quest, ref, amount] of points) writes.push(store.put(`pts/${org}/${gid}/${quest}~${ref}~${amount}`));
  await Promise.all(writes);

  const profile: GuestProfile = { handle: "mikareyes", city: "Pasay City", since: "August 2026", demo: true };
  return { gid, name, tokens, profile };
}

const DEMO_EVENTS: (EventInput & { going: number; maybe: number })[] = [
  {
    title: "Likha Weekend Market", kind: "Makers market", tagline: "Sixty local makers, two days, one old warehouse.",
    startsAt: "2027-01-16T10:00", hours: 9, venue: "Bodega 12", city: "Pasig", capacity: 1200,
    rsvp: true, plusOnesMax: 3, question: { label: "Which day?", options: ["Saturday", "Sunday", "Both"] },
    tiers: [{ name: "Early-bird tote bundle", price: 450 }], earn: true, going: 486, maybe: 73,
  },
  {
    title: "Riso Printing Workshop", kind: "Workshop", tagline: "Design and print your own two-colour poster.",
    startsAt: "2027-01-17T14:00", hours: 3, venue: "Bodega 12, mezzanine", city: "Pasig", capacity: 16,
    rsvp: false, plusOnesMax: 0, tiers: [{ name: "Workshop seat", price: 1800 }], earn: false, going: 11, maybe: 0,
  },
  {
    title: "Vendors’ Mixer", kind: "Mixer", tagline: "Meet the other makers the night before doors open.",
    startsAt: "2027-01-15T18:30", hours: 3, venue: "Bodega 12 loading bay", city: "Pasig", capacity: 90,
    rsvp: true, plusOnesMax: 1, tiers: [], earn: false, going: 38, maybe: 9,
  },
];

export async function seedDemoMerchant(): Promise<{ merchant: Merchant; key: string } | { error: string }> {
  const created = await createMerchant("Likha Weekend Market", `likha-${newId(4)}`);
  if ("error" in created) return created;
  const merchant = await saveMerchant(created, {
    storefront: {
      tagline: "Handmade things from people who live near you.",
      about: "Likha is a weekend market for local makers: ceramics, prints, plants, small-batch food. Entry is free. Come early for the tote bundle, and bring friends to skip the line.",
      announcement: "January market: RSVPs are open.",
      design: { paper: "#fdf3e7", ink: "#2a1a12", accent: "#e76f51", pattern: "dots", display: "serif", glyph: "❋" },
      hero: "banner",
      cards: "poster",
      corners: "round",
    },
  });
  for (const e of DEMO_EVENTS) {
    const ev = await createEvent(merchant, e);
    if (!("error" in ev)) await store.putDoc(`ev/${ev.slug}`, { ...ev, seeded: { going: e.going, maybe: e.maybe, checkedIn: 0 } });
  }
  return { merchant, key: merchantKey(merchant.mid) };
}

export const SAMPLE_COUNT = EVENTS.length;
