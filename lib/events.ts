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
  lineup?: string[];
  schedule?: { time: string; what: string }[];
  faq?: { q: string; a: string }[];
  /** Already happened: no new entries, existing tickets show as stubs. */
  past?: boolean;
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
    lineup: ["The Low Tides", "Kalye Radio", "Mira Sol", "Neon Jeepney", "Paraluman Sound", "Static Bloom", "Dayo", "Hilera North"],
    schedule: [
      { time: "4:00 PM", what: "Gates open" },
      { time: "5:00 PM", what: "Bay stage starts" },
      { time: "7:30 PM", what: "Main stage starts" },
      { time: "11:00 PM", what: "Closing set" },
    ],
    faq: [
      { q: "How do I earn a ticket?", a: "Join the crew on the Earn tab. Bring friends and show up to Sunday Run Club: 300 points gets you General Admission." },
      { q: "Can I transfer my ticket?", a: "Not in this prototype. Transfers and capped resale are planned." },
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
  {
    slug: "kanto-night-market",
    org: { id: "kanto", name: "Kanto Collective" },
    kind: "Night market",
    title: "Kanto Night Market",
    tagline: "Forty stalls, one closed street, grills going until midnight.",
    startsAt: "2026-12-19T17:00:00+08:00",
    endsAt: "2026-12-19T23:59:00+08:00",
    dateLabel: "Sat 19 Dec 2026",
    timeLabel: "5:00 PM",
    venue: "Calle Kanto (closed to cars)",
    city: "Makati",
    country: "PH",
    currency: "PHP",
    capacity: 2500,
    seeded: { going: 1386, maybe: 212, checkedIn: 0 },
    rsvp: true,
    plusOnesMax: 4,
    questions: [{ id: "slot", label: "When are you coming?", options: ["Early, 5 to 7 PM", "Peak, 7 to 10 PM", "Late, after 10 PM"] }],
    tiers: [{ id: "pass", name: "Tasting pass", priceMinor: 65000, perks: "Six tasting stubs and a tote" }],
    earn: {
      quests: [
        { id: "join", title: "RSVP", desc: "Tell us you’re coming so stalls can prep.", points: 50 },
        { id: "showup", title: "Show up", desc: "Scan in at either gate.", points: 100 },
        { id: "refer", title: "Bring your barkada", desc: "Points land when each friend is scanned in.", points: 150 },
      ],
      rewards: [
        { id: "pass-free", title: "Free tasting pass", desc: "Six tasting stubs, on us.", cost: 300, kind: "ticket", tierId: "pass" },
        { id: "front", title: "Front of the grill queue", desc: "One skip at any stall.", cost: 150, kind: "perk" },
      ],
      ticketBudget: 100,
    },
    design: { paper: "#fff3d1", ink: "#2b1400", accent: "#ff6a1f", pattern: "stripes", display: "grotesk", glyph: "☀" },
    about: [
      "A street closed for one night and handed to forty food stalls, three bars and a tiny stage.",
      "Entry is free with an RSVP so the stalls know how much to cook. The tasting pass is optional.",
    ],
    lineup: ["Inihaw Republic", "Lola Ising’s Lugaw", "Smash Bros. Burgers", "Tita Bing’s Bibingka", "Kape Kanto", "Halo-Halo Lab"],
    schedule: [
      { time: "5:00 PM", what: "Gates open, stalls start serving" },
      { time: "7:30 PM", what: "Acoustic set on the corner stage" },
      { time: "9:00 PM", what: "Cook-off: sisig, three ways" },
      { time: "11:30 PM", what: "Last orders" },
    ],
    faq: [
      { q: "Is it really free?", a: "Yes. Entry is free with an RSVP. Food is paid at the stalls, or with a tasting pass." },
      { q: "Can I bring kids or pets?", a: "Kids, yes. Pets on a leash are welcome before 8 PM, when it gets crowded." },
    ],
    doorCode: "2468",
  },
  {
    slug: "shipyard-conf-2027",
    org: { id: "shipyard", name: "Shipyard" },
    kind: "Conference",
    title: "Shipyard Conf 2027",
    tagline: "One day, one track, twelve talks from people who ship.",
    startsAt: "2027-03-13T09:00:00+08:00",
    endsAt: "2027-03-13T18:00:00+08:00",
    dateLabel: "Sat 13 Mar 2027",
    timeLabel: "9:00 AM",
    venue: "The Foundry Hall",
    city: "Taguig",
    country: "PH",
    currency: "PHP",
    capacity: 900,
    seeded: { going: 412, maybe: 0, checkedIn: 0 },
    rsvp: false,
    plusOnesMax: 0,
    questions: [],
    tiers: [
      { id: "student", name: "Student", priceMinor: 90000, perks: "Valid school ID at the door" },
      { id: "standard", name: "Standard", priceMinor: 280000, perks: "Talks, lunch, after-party" },
      { id: "team", name: "Supporter", priceMinor: 550000, perks: "Standard, plus you fund a student seat" },
    ],
    earn: {
      quests: [
        { id: "join", title: "Join the crew", desc: "Sign up to volunteer or spread the word.", points: 50 },
        { id: "showup", title: "Show up", desc: "Scan in on the day.", points: 100 },
        { id: "refer", title: "Bring a teammate", desc: "Points land when they are scanned in.", points: 150 },
      ],
      rewards: [
        { id: "seat", title: "Free student seat", desc: "One Student ticket.", cost: 300, kind: "ticket", tierId: "student" },
        { id: "workshop", title: "Workshop seat", desc: "A place in the afternoon workshop.", cost: 150, kind: "perk" },
      ],
      ticketBudget: 40,
    },
    design: { paper: "#0b1d2a", ink: "#eaf6ff", accent: "#38e1c6", pattern: "grid", display: "mono", glyph: "◆" },
    about: ["A single-track conference for engineers, designers and founders building products in Southeast Asia.", "Supporter tickets pay for student seats. Volunteers and referrers can earn one."],
    lineup: ["Carla Dizon", "Ravi Menon", "Thao Nguyen", "Miguel Santos", "Aiko Tan", "Jomar Uy"],
    schedule: [
      { time: "9:00 AM", what: "Doors and coffee" },
      { time: "10:00 AM", what: "Morning talks" },
      { time: "12:30 PM", what: "Lunch" },
      { time: "2:00 PM", what: "Afternoon talks and workshop" },
      { time: "6:00 PM", what: "After-party" },
    ],
    faq: [
      { q: "Can my company pay by invoice?", a: "Yes, for five or more Standard tickets. Reply to your receipt." },
      { q: "Is the venue accessible?", a: "Step-free from the mall entrance, with reserved seating at the front. Tell us what you need when you book." },
    ],
    doorCode: "2468",
  },
  {
    slug: "lia-and-marco",
    org: { id: "liamarco", name: "Lia & Marco" },
    kind: "Wedding",
    title: "Lia & Marco",
    tagline: "We’re getting married in the garden where we met. Please come.",
    startsAt: "2027-01-23T15:30:00+08:00",
    endsAt: "2027-01-23T22:00:00+08:00",
    dateLabel: "Sat 23 Jan 2027",
    timeLabel: "3:30 PM",
    venue: "Hardin ni Lola Remedios",
    city: "Indang, Cavite",
    country: "PH",
    currency: "PHP",
    capacity: 160,
    seeded: { going: 96, maybe: 11, checkedIn: 0 },
    rsvp: true,
    plusOnesMax: 1,
    questions: [
      { id: "meal", label: "Meal", options: ["Beef", "Fish", "Vegetarian"] },
      { id: "shuttle", label: "Shuttle from Makati?", options: ["No, driving", "Yes, one seat", "Yes, two seats"] },
    ],
    tiers: [],
    design: { paper: "#f4f1ea", ink: "#2c3327", accent: "#b7c4a1", pattern: "none", display: "serif", glyph: "❋" },
    about: ["Ceremony at 3:30 in the garden, dinner and dancing after. Your RSVP helps us plan seats, meals and the shuttle."],
    schedule: [
      { time: "3:30 PM", what: "Ceremony" },
      { time: "5:00 PM", what: "Cocktails" },
      { time: "6:30 PM", what: "Dinner" },
      { time: "8:30 PM", what: "Dancing" },
    ],
    faq: [{ q: "What should I wear?", a: "Garden formal. The lawn is soft, so skip the stilettos." }],
    doorCode: "2468",
  },
  {
    slug: "open-mic-sa-likod",
    org: { id: "likod", name: "Likod Bar" },
    kind: "Open mic",
    title: "Open Mic sa Likod",
    tagline: "Five minutes each. Jokes, songs, poems, whatever you’ve got.",
    startsAt: "2026-12-10T20:00:00+08:00",
    endsAt: "2026-12-10T23:00:00+08:00",
    dateLabel: "Thu 10 Dec 2026",
    timeLabel: "8:00 PM",
    venue: "Likod Bar, back room",
    city: "Quezon City",
    country: "PH",
    currency: "PHP",
    capacity: 70,
    seeded: { going: 44, maybe: 0, checkedIn: 0 },
    rsvp: false,
    plusOnesMax: 0,
    questions: [],
    tiers: [{ id: "seat", name: "Seat", priceMinor: 25000, perks: "One drink included" }],
    earn: {
      quests: [
        { id: "join", title: "Join the regulars", desc: "Get on the list.", points: 50 },
        { id: "showup", title: "Show up", desc: "Scan in at the door.", points: 100 },
        { id: "refer", title: "Bring a first-timer", desc: "Points land when they are scanned in.", points: 150 },
      ],
      rewards: [{ id: "seat-free", title: "Free seat", desc: "One seat with a drink.", cost: 300, kind: "ticket", tierId: "seat" }],
      ticketBudget: 6,
    },
    design: { paper: "#1b0f1f", ink: "#ffe9f6", accent: "#ff5fa8", pattern: "dots", display: "grotesk", glyph: "♪" },
    about: ["A small room, a loud crowd, and a sign-up sheet at the bar. Performers get in free, everyone else gets a drink with their seat."],
    doorCode: "2468",
  },
  {
    slug: "barangay-3x3-open",
    org: { id: "courtside", name: "Courtside PH" },
    kind: "Tournament",
    title: "Barangay 3x3 Open",
    tagline: "Thirty-two teams, one covered court, winner takes the banner.",
    startsAt: "2027-02-06T08:00:00+08:00",
    endsAt: "2027-02-06T18:00:00+08:00",
    dateLabel: "Sat 6 Feb 2027",
    timeLabel: "8:00 AM",
    venue: "San Roque Covered Court",
    city: "Marikina",
    country: "PH",
    currency: "PHP",
    capacity: 600,
    seeded: { going: 268, maybe: 37, checkedIn: 0 },
    rsvp: true,
    plusOnesMax: 3,
    questions: [{ id: "side", label: "Who are you cheering for?", options: ["Just watching", "A team from my barangay", "I’m playing"] }],
    tiers: [{ id: "team", name: "Team entry", priceMinor: 120000, perks: "Four players, jerseys, three games minimum" }],
    design: { paper: "#fdf0e3", ink: "#1f1305", accent: "#f08a24", pattern: "waves", display: "grotesk", glyph: "◐" },
    about: ["A one-day 3x3 tournament. Watching is free with an RSVP. Team captains buy one entry for the whole team."],
    schedule: [
      { time: "8:00 AM", what: "Team check-in" },
      { time: "9:00 AM", what: "Group games" },
      { time: "2:00 PM", what: "Knockouts" },
      { time: "5:00 PM", what: "Final and awarding" },
    ],
    doorCode: "2468",
  },
  {
    slug: "bayfront-sunset-sessions",
    org: BAYFRONT,
    kind: "Concert",
    title: "Sunset Sessions",
    tagline: "Four acoustic sets as the sun went down.",
    startsAt: "2026-10-17T16:30:00+08:00",
    endsAt: "2026-10-17T20:30:00+08:00",
    dateLabel: "Sat 17 Oct 2026",
    timeLabel: "4:30 PM",
    venue: "Bayfront Grounds",
    city: "Pasay City",
    country: "PH",
    currency: "PHP",
    capacity: 500,
    seeded: { going: 463, maybe: 0, checkedIn: 431 },
    rsvp: false,
    plusOnesMax: 0,
    questions: [],
    tiers: [{ id: "ga", name: "General Admission", priceMinor: 60000, perks: "Lawn seating" }],
    design: { paper: "#ffe3c7", ink: "#3b1205", accent: "#ff7b54", pattern: "waves", display: "grotesk", glyph: "☀" },
    about: ["Four acoustic sets on the lawn."],
    past: true,
    doorCode: "2468",
  },
  {
    slug: "build-night-13",
    org: { id: "buildnight", name: "Build Night MNL" },
    kind: "Meetup",
    title: "Build Night #13",
    tagline: "November show-and-tell.",
    startsAt: "2026-11-05T18:30:00+08:00",
    endsAt: "2026-11-05T21:30:00+08:00",
    dateLabel: "Thu 5 Nov 2026",
    timeLabel: "6:30 PM",
    venue: "Common Room, 4F Sikap Building",
    city: "Quezon City",
    country: "PH",
    currency: "PHP",
    capacity: 120,
    seeded: { going: 93, maybe: 0, checkedIn: 78 },
    rsvp: true,
    plusOnesMax: 0,
    questions: [],
    tiers: [],
    design: { paper: "#eef1ff", ink: "#10143a", accent: "#8e9bff", pattern: "grid", display: "mono", glyph: "◆" },
    about: ["The November edition."],
    past: true,
    doorCode: "2468",
  },
  {
    slug: "sunday-run-club-nov",
    org: BAYFRONT,
    kind: "Run club",
    title: "Sunday Run Club",
    tagline: "The November 22 run.",
    startsAt: "2026-11-22T06:00:00+08:00",
    endsAt: "2026-11-22T08:00:00+08:00",
    dateLabel: "Sun 22 Nov 2026",
    timeLabel: "6:00 AM",
    venue: "Seaside Boulevard, Gate 2",
    city: "Pasay City",
    country: "PH",
    currency: "PHP",
    capacity: 150,
    seeded: { going: 81, maybe: 0, checkedIn: 64 },
    rsvp: true,
    plusOnesMax: 2,
    questions: [],
    tiers: [],
    design: { paper: "#e4f5ea", ink: "#0c2b1c", accent: "#7bd89b", pattern: "stripes", display: "grotesk", glyph: "➜" },
    about: ["The November 22 run."],
    past: true,
    doorCode: "2468",
  },
];

/** Events still to come, soonest first. */
export const UPCOMING: EventDef[] = EVENTS.filter((e) => !e.past).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

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
