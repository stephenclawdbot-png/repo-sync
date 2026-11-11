import type { CSSProperties } from "react";
import { contrast, readableOn } from "./contrast";

export type Via = "rsvp" | "buy" | "earn";
export type Pattern = "dots" | "stripes" | "grid" | "waves" | "none";
export type DisplayFont = "grotesk" | "serif" | "mono";

export interface Design {
  paper: string;
  ink: string;
  accent: string;
  pattern: Pattern;
  display: DisplayFont;
  glyph: string;
}

export interface Tier {
  id: string;
  name: string;
  priceMinor: number;
  perks: string;
}

export type QuestId = "join" | "refer" | "showup";

export interface Quest {
  id: QuestId;
  title: string;
  desc: string;
  points: number;
}

export interface Reward {
  id: string;
  title: string;
  desc: string;
  cost: number;
  kind: "ticket" | "perk";
  tierId?: string;
}

export interface Question {
  id: string;
  label: string;
  options: string[];
}

export interface EventDef {
  slug: string;
  org: { id: string; name: string };
  kind: string;
  title: string;
  tagline: string;
  startsAt: string;
  endsAt: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  city: string;
  country: string;
  currency: string;
  capacity: number;
  /** Guests already on the list before the demo started. */
  seeded: { going: number; maybe: number; checkedIn: number };
  rsvp: boolean;
  plusOnesMax: number;
  questions: Question[];
  tiers: Tier[];
  earn?: { quests: Quest[]; rewards: Reward[]; ticketBudget: number };
  design: Design;
  about: string[];
  /** Demo door code. Real events get a per-device staff login. */
  doorCode: string;
}

const BAYFRONT = { id: "bayfront", name: "Bayfront Collective" };

const BAYFRONT_QUESTS: Quest[] = [
  { id: "join", title: "Join the list", desc: "RSVP or join the crew for this event.", points: 50 },
  { id: "showup", title: "Show up", desc: "Get your ticket scanned at the door.", points: 100 },
  { id: "refer", title: "Bring a friend", desc: "Share your invite link. Points land when your friend is scanned in.", points: 150 },
];

export const EVENTS: EventDef[] = [
  {
    slug: "manila-sound-fest",
    org: BAYFRONT,
    kind: "Concert",
    title: "Manila Sound Fest",
    tagline: "Two stages, twelve acts, one night by the bay.",
    startsAt: "2027-02-20T16:00:00+08:00",
    endsAt: "2027-02-20T23:59:00+08:00",
    dateLabel: "Sat 20 Feb 2027",
    timeLabel: "4:00 PM",
    venue: "Bayfront Grounds",
    city: "Pasay City",
    country: "PH",
    currency: "PHP",
    capacity: 1800,
    seeded: { going: 1124, maybe: 0, checkedIn: 0 },
    rsvp: false,
    plusOnesMax: 0,
    questions: [],
    tiers: [
      { id: "ga", name: "General Admission", priceMinor: 180000, perks: "Standing, both stages" },
      { id: "vip", name: "VIP", priceMinor: 450000, perks: "Front pit, lounge, fast lane" },
    ],
    earn: {
      quests: BAYFRONT_QUESTS,
      rewards: [
        { id: "ga-ticket", title: "Free GA ticket", desc: "One General Admission ticket.", cost: 300, kind: "ticket", tierId: "ga" },
        { id: "fastlane", title: "Fast lane entry", desc: "Skip the main queue on the night.", cost: 150, kind: "perk" },
      ],
      ticketBudget: 50,
    },
    design: { paper: "#15121f", ink: "#f5f0ff", accent: "#ffd25e", pattern: "dots", display: "grotesk", glyph: "✦" },
    about: [
      "Twelve acts across two stages on the bay, from sundown to midnight.",
      "Buy a ticket, or join the crew and earn one: bring friends, show up to Bayfront events, and trade your points in.",
    ],
    doorCode: "2468",
  },
  {
    slug: "sunday-run-club",
    org: BAYFRONT,
    kind: "Run club",
    title: "Sunday Run Club",
    tagline: "Easy 5K or steady 10K. Coffee after. Everyone welcome.",
    startsAt: "2026-12-06T06:00:00+08:00",
    endsAt: "2026-12-06T08:00:00+08:00",
    dateLabel: "Sun 6 Dec 2026",
    timeLabel: "6:00 AM",
    venue: "Seaside Boulevard, Gate 2",
    city: "Pasay City",
    country: "PH",
    currency: "PHP",
    capacity: 150,
    seeded: { going: 62, maybe: 9, checkedIn: 0 },
    rsvp: true,
    plusOnesMax: 2,
    questions: [{ id: "pace", label: "Which group?", options: ["Easy 5K", "Steady 10K", "Walking"] }],
    tiers: [],
    earn: {
      quests: BAYFRONT_QUESTS,
      rewards: [{ id: "coffee", title: "Coffee on us", desc: "One free drink at the finish.", cost: 150, kind: "perk" }],
      ticketBudget: 0,
    },
    design: { paper: "#e4f5ea", ink: "#0c2b1c", accent: "#7bd89b", pattern: "stripes", display: "grotesk", glyph: "➜" },
    about: [
      "A no-drop social run along the boulevard. Pick a pace group when you RSVP.",
      "Points you earn here count toward Bayfront Collective rewards, including a free Manila Sound Fest ticket.",
    ],
    doorCode: "2468",
  },
  {
    slug: "rooftop-housewarming",
    org: { id: "ines", name: "Ines & Paolo" },
    kind: "House party",
    title: "Rooftop Housewarming",
    tagline: "We finally moved. Come see the view and eat too much.",
    startsAt: "2026-12-12T19:00:00+08:00",
    endsAt: "2026-12-12T23:30:00+08:00",
    dateLabel: "Sat 12 Dec 2026",
    timeLabel: "7:00 PM",
    venue: "Unit 31F, The Linden",
    city: "Makati",
    country: "PH",
    currency: "PHP",
    capacity: 60,
    seeded: { going: 23, maybe: 6, checkedIn: 0 },
    rsvp: true,
    plusOnesMax: 3,
    questions: [{ id: "food", label: "Food preference", options: ["No preference", "Vegetarian", "No pork", "No seafood"] }],
    tiers: [],
    design: { paper: "#ffe9e0", ink: "#3a0d1e", accent: "#ff8a6b", pattern: "waves", display: "serif", glyph: "✺" },
    about: ["Drinks and dinner on the roof deck. Bring a plus-one or three, just tell us so we cook enough."],
    doorCode: "2468",
  },
  {
    slug: "build-night",
    org: { id: "buildnight", name: "Build Night MNL" },
    kind: "Meetup",
    title: "Build Night #14",
    tagline: "Show what you made this month. Five-minute demos, no slides.",
    startsAt: "2026-12-17T18:30:00+08:00",
    endsAt: "2026-12-17T21:30:00+08:00",
    dateLabel: "Thu 17 Dec 2026",
    timeLabel: "6:30 PM",
    venue: "Common Room, 4F Sikap Building",
    city: "Quezon City",
    country: "PH",
    currency: "PHP",
    capacity: 120,
    seeded: { going: 71, maybe: 14, checkedIn: 0 },
    rsvp: true,
    plusOnesMax: 0,
    questions: [{ id: "demo", label: "Are you demoing?", options: ["Just watching", "Yes, I have a demo"] }],
    tiers: [],
    earn: {
      quests: [
        { id: "join", title: "RSVP", desc: "Get on the list.", points: 50 },
        { id: "showup", title: "Show up", desc: "Get scanned in at the door.", points: 100 },
        { id: "refer", title: "Bring a first-timer", desc: "Points land when your friend is scanned in.", points: 150 },
      ],
      rewards: [{ id: "frontrow", title: "Front-row seat", desc: "A reserved seat at the next Build Night.", cost: 150, kind: "perk" }],
      ticketBudget: 0,
    },
    design: { paper: "#eef1ff", ink: "#10143a", accent: "#8e9bff", pattern: "grid", display: "mono", glyph: "◆" },
    about: ["A monthly show-and-tell for people who make things. Free, with pizza while it lasts."],
    doorCode: "2468",
  },
  {
    slug: "wheel-throwing-101",
    org: { id: "luad", name: "Luad Studio" },
    kind: "Workshop",
    title: "Wheel Throwing 101",
    tagline: "Three hours, one wheel each, two pieces to take home.",
    startsAt: "2027-01-09T14:00:00+08:00",
    endsAt: "2027-01-09T17:00:00+08:00",
    dateLabel: "Sat 9 Jan 2027",
    timeLabel: "2:00 PM",
    venue: "Luad Studio",
    city: "Marikina",
    country: "PH",
    currency: "PHP",
    capacity: 12,
    seeded: { going: 7, maybe: 0, checkedIn: 0 },
    rsvp: false,
    plusOnesMax: 0,
    questions: [],
    tiers: [{ id: "seat", name: "Workshop seat", priceMinor: 250000, perks: "Clay, tools, glazing and firing included" }],
    design: { paper: "#f3e9dc", ink: "#33241a", accent: "#dc9a6c", pattern: "none", display: "serif", glyph: "◐" },
    about: ["A beginner class on the wheel. Small group, so seats go quickly. If it is full you can join the waitlist."],
    doorCode: "2468",
  },
];

export function getEvent(slug: string): EventDef | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export function paths(ev: EventDef): Via[] {
  const out: Via[] = [];
  if (ev.rsvp) out.push("rsvp");
  if (ev.tiers.length) out.push("buy");
  if (ev.earn) out.push("earn");
  return out;
}

export const VIA_LABEL: Record<Via, string> = { rsvp: "RSVP", buy: "Bought", earn: "Earned" };

export function tierLabel(ev: EventDef, tierId: string): string {
  return ev.tiers.find((t) => t.id === tierId)?.name ?? "Guest list";
}

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: minor % 100 ? 2 : 0 }).format(minor / 100);
}

/** Platform fee on paid tickets: 3.5 % + ₱15 per ticket (placeholder pricing). */
export function platformFee(subtotalMinor: number, qty: number): number {
  return Math.round(subtotalMinor * 0.035) + 1500 * qty;
}

export function priceLine(ev: EventDef): string {
  const parts: string[] = [];
  if (ev.rsvp) parts.push("Free RSVP");
  if (ev.tiers.length) parts.push(`From ${formatMoney(Math.min(...ev.tiers.map((t) => t.priceMinor)), ev.currency)}`);
  if (ev.earn) parts.push(ev.earn.rewards.some((r) => r.kind === "ticket") ? "or earn a ticket" : "earn perks");
  return parts.join(" · ");
}

const FONT_VAR: Record<DisplayFont, string> = {
  grotesk: "var(--font-display)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
};

/** CSS custom properties that theme an event page, ticket or stub. Text colours are contrast-checked. */
export function designVars(d: Design): CSSProperties {
  const ink = contrast(d.paper, d.ink) >= 4.5 ? d.ink : readableOn(d.paper);
  return {
    "--e-paper": d.paper,
    "--e-ink": ink,
    "--e-accent": d.accent,
    "--e-on-accent": readableOn(d.accent, [ink, d.paper, "#17140f", "#ffffff"]),
    "--e-display": FONT_VAR[d.display],
  } as CSSProperties;
}

export function serial(n: number): string {
  return String(n).padStart(4, "0");
}
