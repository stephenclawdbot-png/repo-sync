import type { Design } from "./events";

/** Client-safe storefront types and defaults (no server imports here). */

export type SectionId = "events" | "about" | "ways" | "stubs";
export type HeroStyle = "left" | "center" | "banner";
export type CardStyle = "ticket" | "poster" | "list";
export type Corners = "soft" | "sharp" | "round";

export interface Storefront {
  tagline: string;
  about: string;
  announcement: string;
  design: Design;
  hero: HeroStyle;
  cards: CardStyle;
  corners: Corners;
  /** Ordered; `on: false` hides a section without losing its place. */
  sections: { id: SectionId; on: boolean }[];
}

export interface Merchant {
  mid: string;
  handle: string;
  name: string;
  storefront: Storefront;
  createdAt: number;
}

export const SECTION_LABEL: Record<SectionId, string> = {
  events: "Events",
  about: "About",
  ways: "Ways in",
  stubs: "Stubs",
};

export const DEFAULT_STOREFRONT: Storefront = {
  tagline: "Come through.",
  about: "",
  announcement: "",
  design: { paper: "#fff6d6", ink: "#231a00", accent: "#ffb703", pattern: "stripes", display: "grotesk", glyph: "✦" },
  hero: "left",
  cards: "ticket",
  corners: "soft",
  sections: [
    { id: "events", on: true },
    { id: "about", on: true },
    { id: "ways", on: true },
    { id: "stubs", on: true },
  ],
};

/** What the back office sends when a merchant creates an event. */
export interface EventInput {
  title: string;
  kind: string;
  tagline: string;
  /** Local date-time in Manila, e.g. "2027-03-14T20:00". */
  startsAt: string;
  hours: number;
  venue: string;
  city: string;
  capacity: number;
  rsvp: boolean;
  plusOnesMax: number;
  question?: { label: string; options: string[] };
  tiers: { name: string; price: number }[];
  earn: boolean;
}
