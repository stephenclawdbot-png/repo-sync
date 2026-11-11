export interface Tier {
  id: string;
  name: string;
  priceMinor: number;
  perks: string;
  remaining: number;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  font: string;
  radius: number;
  layout: "split" | "centered";
}

export interface DemoEvent {
  slug: string;
  title: string;
  tagline: string;
  date: string;
  endsAt: string;
  venue: string;
  country: string;
  currency: string;
  tiers: Tier[];
  lineup: string[];
}

export const DEMO_EVENT: DemoEvent = {
  slug: "manila-sound-fest",
  title: "Manila Sound Fest 2027",
  tagline: "Two stages. Twelve acts. One night by the bay.",
  date: "Sat, 20 Feb 2027 · 4:00 PM",
  endsAt: "2027-02-20T23:59:00Z",
  venue: "Bayfront Grounds, Pasay City",
  country: "PH",
  currency: "PHP",
  tiers: [
    { id: "ga", name: "General Admission", priceMinor: 180000, perks: "Standing, both stages", remaining: 1240 },
    { id: "vip", name: "VIP", priceMinor: 450000, perks: "Front pit, lounge, fast lane", remaining: 86 },
    { id: "bundle", name: "GA + Tour Shirt", priceMinor: 230000, perks: "Ticket + merch pickup on site", remaining: 310 },
  ],
  lineup: ["The Low Tides", "Kalye Radio", "Mira Sol", "Neon Jeepney", "Paraluman", "Static Bloom"],
};

export const THEMES: Theme[] = [
  {
    id: "night",
    name: "Night Stage",
    bg: "#0d0b14",
    surface: "#181424",
    text: "#f4f1ff",
    muted: "#a59fbd",
    accent: "#ff4f8b",
    accentText: "#ffffff",
    font: "'Space Grotesk', system-ui, sans-serif",
    radius: 14,
    layout: "split",
  },
  {
    id: "paper",
    name: "Paper Poster",
    bg: "#f6f1e7",
    surface: "#fffdf8",
    text: "#1d1a16",
    muted: "#6f675c",
    accent: "#d6451b",
    accentText: "#ffffff",
    font: "Georgia, 'Times New Roman', serif",
    radius: 2,
    layout: "centered",
  },
  {
    id: "lagoon",
    name: "Lagoon",
    bg: "#eaf6f5",
    surface: "#ffffff",
    text: "#0b2b2a",
    muted: "#4b6f6d",
    accent: "#0f8f86",
    accentText: "#ffffff",
    font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    radius: 22,
    layout: "split",
  },
];

export const METHOD_LABELS: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  qrph: "QR Ph",
  card: "Card",
  grabpay: "GrabPay",
  paypal: "PayPal",
  paynow: "PayNow",
  promptpay: "PromptPay",
  duitnow: "DuitNow",
  qris: "QRIS",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(minor / 100);
}

/** Platform fee: 3.5 % + ₱15 per ticket (placeholder pricing). */
export function platformFee(subtotalMinor: number, qty: number): number {
  return Math.round(subtotalMinor * 0.035) + 1500 * qty;
}
