/**
 * Merchant accounts, their storefront settings, and the events they create.
 *
 * Demo sign-up has no password: the server hands back a key derived from the merchant id, and the
 * browser keeps it. Production replaces this with real accounts (email or phone verification).
 *
 * Documents:  m/<mid>  merchant profile      ev/<slug>  event created by a merchant
 * Keys:       handle/<handle>~<mid>          mev/<mid>/<slug>
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { contrast, isHex, readableOn } from "./contrast";
import { type Design, type EventDef, EVENTS, getEvent, type Quest } from "./events";
import { DEFAULT_STOREFRONT, type EventInput, type Merchant, type SectionId, type Storefront } from "./storefront";
import { fields, store } from "./store";
import { newId } from "./token";

export const MAX_EVENTS = 6;

/** A ready-made storefront so there is something to look at before signing up. */
const DEMO_MERCHANT: Merchant = {
  mid: "bayfront",
  handle: "bayfront",
  name: "Bayfront Collective",
  createdAt: 0,
  storefront: {
    ...DEFAULT_STOREFRONT,
    tagline: "Shows, runs and long nights by the bay.",
    about:
      "We run things by the water in Pasay: a free run club every Sunday and a festival once a year. Come to the small ones, earn your way into the big one.",
    announcement: "Sound Fest tickets are on sale. Run club members can earn one.",
    design: EVENTS[0].design,
    hero: "banner",
    cards: "ticket",
  },
};

const text = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const int = (v: unknown, min: number, max: number) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

/* ---------- auth ---------- */

const secret = () => process.env.TICKET_SECRET ?? "dev-only-secret-set-TICKET_SECRET-in-production";

export function merchantKey(mid: string): string {
  return createHmac("sha256", secret()).update(`merchant:${mid}`).digest().subarray(0, 18).toString("base64url");
}

/** Reads `x-merchant: <mid>.<key>` and returns the merchant if the key matches. */
export async function authMerchant(req: Request): Promise<Merchant | null> {
  const [mid, key] = (req.headers.get("x-merchant") ?? "").split(".");
  if (!/^[a-z0-9]{10}$/.test(mid ?? "") || !key) return null;
  const expected = Buffer.from(merchantKey(mid));
  const given = Buffer.from(key);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return store.getDoc<Merchant>(`m/${mid}`);
}

/* ---------- storefront ---------- */

export function cleanDesign(v: unknown, fallback: Design): Design {
  const d = (v ?? {}) as Partial<Design>;
  const paper = isHex(String(d.paper)) ? String(d.paper) : fallback.paper;
  let ink = isHex(String(d.ink)) ? String(d.ink) : fallback.ink;
  if (contrast(paper, ink) < 4.5) ink = readableOn(paper);
  return {
    paper,
    ink,
    accent: isHex(String(d.accent)) ? String(d.accent) : fallback.accent,
    pattern: pick(d.pattern, ["dots", "stripes", "grid", "waves", "none"] as const, fallback.pattern),
    display: pick(d.display, ["grotesk", "serif", "mono"] as const, fallback.display),
    glyph: pick(d.glyph, ["✦", "✺", "◆", "◐", "➜", "♪", "☀", "❋"] as const, "✦"),
  };
}

export function cleanStorefront(v: unknown, prev: Storefront): Storefront {
  const s = (v ?? {}) as Partial<Storefront>;
  const ids: SectionId[] = ["events", "about", "ways", "stubs"];
  const given = Array.isArray(s.sections) ? s.sections.filter((x) => ids.includes(x?.id)) : [];
  const ordered = [...new Map([...given, ...prev.sections].map((x) => [x.id, { id: x.id, on: Boolean(x.on) }])).values()];
  return {
    tagline: text(s.tagline ?? prev.tagline, 90),
    about: text(s.about ?? prev.about, 500),
    announcement: text(s.announcement ?? prev.announcement, 120),
    design: cleanDesign(s.design, prev.design),
    hero: pick(s.hero, ["left", "center", "banner"] as const, prev.hero),
    cards: pick(s.cards, ["ticket", "poster", "list"] as const, prev.cards),
    corners: pick(s.corners, ["soft", "sharp", "round"] as const, prev.corners),
    sections: ordered,
  };
}

/* ---------- merchants ---------- */

const RESERVED = ["bayfront", "admin", "api", "stagepass", "signup", "dashboard", "me", "scan", "studio", "host"];

export function cleanHandle(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export async function createMerchant(nameIn: unknown, handleIn: unknown): Promise<Merchant | { error: string }> {
  const name = text(nameIn, 40);
  const handle = cleanHandle(handleIn || nameIn);
  if (name.length < 2) return { error: "Enter your organizer or business name." };
  if (handle.length < 3) return { error: "The storefront address needs at least 3 letters or numbers." };
  if (RESERVED.includes(handle) || (await store.list(`handle/${handle}~`)).length) {
    return { error: "That storefront address is taken. Try another." };
  }
  const merchant: Merchant = { mid: newId(10), handle, name, storefront: DEFAULT_STOREFRONT, createdAt: Date.now() };
  await store.putDoc(`m/${merchant.mid}`, merchant);
  await store.put(`handle/${handle}~${merchant.mid}`);
  return merchant;
}

export async function getMerchantByHandle(handle: string): Promise<Merchant | null> {
  if (handle === DEMO_MERCHANT.handle) return DEMO_MERCHANT;
  if (!/^[a-z0-9-]{3,24}$/.test(handle)) return null;
  const [key] = await store.list(`handle/${handle}~`);
  return key ? store.getDoc<Merchant>(`m/${fields(key)[1]}`) : null;
}

export async function merchantEvents(mid: string): Promise<EventDef[]> {
  if (mid === DEMO_MERCHANT.mid) return EVENTS.filter((e) => e.org.id === mid);
  const keys = await store.list(`mev/${mid}/`);
  const events = await Promise.all(keys.map((k) => store.getDoc<EventDef>(`ev/${fields(k)[0]}`)));
  return events.filter((e): e is EventDef => Boolean(e)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function saveMerchant(m: Merchant, patch: { name?: unknown; storefront?: unknown }): Promise<Merchant> {
  const next: Merchant = {
    ...m,
    name: patch.name === undefined ? m.name : text(patch.name, 40) || m.name,
    storefront: patch.storefront === undefined ? m.storefront : cleanStorefront(patch.storefront, m.storefront),
  };
  await store.putDoc(`m/${m.mid}`, next);
  // One design everywhere: the merchant's events follow the storefront.
  const events = await merchantEvents(m.mid);
  await Promise.all(
    events.map((e) => store.putDoc(`ev/${e.slug}`, { ...e, org: { id: m.mid, name: next.name }, design: next.storefront.design })),
  );
  return next;
}

/* ---------- events ---------- */

/** Built-in demo events first, then events created by merchants. */
export async function findEvent(slug: string): Promise<EventDef | undefined> {
  const fixed = getEvent(slug);
  if (fixed) return fixed;
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return undefined;
  return (await store.getDoc<EventDef>(`ev/${slug}`)) ?? undefined;
}

const QUESTS: Quest[] = [
  { id: "join", title: "Join the list", desc: "RSVP or join the crew for this event.", points: 50 },
  { id: "showup", title: "Show up", desc: "Get your ticket scanned at the door.", points: 100 },
  { id: "refer", title: "Bring a friend", desc: "Share your invite link. Points land when your friend is scanned in.", points: 150 },
];

export async function createEvent(m: Merchant, raw: unknown): Promise<EventDef | { error: string }> {
  const input = (raw ?? {}) as Partial<EventInput>;
  if ((await store.list(`mev/${m.mid}/`)).length >= MAX_EVENTS) return { error: `The demo allows up to ${MAX_EVENTS} events per organizer.` };

  const title = text(input.title, 50);
  if (title.length < 3) return { error: "Give the event a name." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(input.startsAt))) return { error: "Choose a date and time." };
  const start = new Date(`${input.startsAt}:00+08:00`);
  if (Number.isNaN(start.getTime())) return { error: "Choose a date and time." };
  const end = new Date(start.getTime() + int(input.hours, 1, 24) * 3600e3);

  const tiers = (Array.isArray(input.tiers) ? input.tiers : [])
    .map((t, i) => ({ id: `t${i + 1}`, name: text(t?.name, 30), priceMinor: int(t?.price, 0, 500000) * 100, perks: "" }))
    .filter((t) => t.name && t.priceMinor > 0)
    .slice(0, 3);
  const rsvp = Boolean(input.rsvp);
  if (!rsvp && !tiers.length) return { error: "Open at least one way in: free RSVP or a paid ticket." };

  const capacity = int(input.capacity, 1, 50000);
  const options = (input.question?.options ?? []).map((o) => text(o, 30)).filter(Boolean).slice(0, 5);
  const qLabel = text(input.question?.label, 50);
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", ...opts }).format(start);
  const iso = (d: Date) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 19) + "+08:00";
  const slugBase = cleanHandle(title).slice(0, 40) || "event";

  const ev: EventDef = {
    slug: `${slugBase}-${newId(4)}`,
    org: { id: m.mid, name: m.name },
    kind: text(input.kind, 20) || "Event",
    title,
    tagline: text(input.tagline, 120),
    startsAt: iso(start),
    endsAt: iso(end),
    dateLabel: `${fmt({ weekday: "short" })} ${fmt({ day: "numeric" })} ${fmt({ month: "short" })} ${fmt({ year: "numeric" })}`,
    timeLabel: new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(start),
    venue: text(input.venue, 50) || "Venue to be announced",
    city: text(input.city, 30) || "Manila",
    country: "PH",
    currency: "PHP",
    capacity,
    seeded: { going: 0, maybe: 0, checkedIn: 0 },
    rsvp,
    plusOnesMax: rsvp ? int(input.plusOnesMax, 0, 5) : 0,
    questions: rsvp && qLabel && options.length >= 2 ? [{ id: "q1", label: qLabel, options }] : [],
    tiers,
    earn: input.earn
      ? {
          quests: QUESTS,
          rewards: tiers.length
            ? [{ id: "free-ticket", title: `Free ${tiers[0].name}`, desc: "One ticket, on the house.", cost: 300, kind: "ticket", tierId: tiers[0].id }]
            : [{ id: "fastlane", title: "Skip the line", desc: "Walk straight in on the day.", cost: 150, kind: "perk" }],
          ticketBudget: tiers.length ? Math.max(1, Math.round(capacity * 0.1)) : 0,
        }
      : undefined,
    design: m.storefront.design,
    about: text(input.tagline, 120) ? [text(input.tagline, 120)] : [],
    doorCode: String(1000 + (Number.parseInt(newId(6), 36) % 9000)),
  };
  await store.putDoc(`ev/${ev.slug}`, ev);
  await store.put(`mev/${m.mid}/${ev.slug}`);
  return ev;
}

export async function deleteEvent(m: Merchant, slug: string): Promise<boolean> {
  if (!(await store.list(`mev/${m.mid}/${slug}`)).some((k) => fields(k)[0] === slug)) return false;
  await Promise.all([
    store.remove(`mev/${m.mid}/${slug}`),
    store.remove(`ev/${slug}`),
    ...["tix", "rsvp", "wait", "in", "ref", "perk"].map((p) => store.remove(`${p}/${slug}/`)),
  ]);
  return true;
}
