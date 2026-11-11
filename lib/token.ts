import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Via } from "./events";

/** What a ticket QR carries. Short keys keep the QR easy to scan. */
export interface TicketClaims {
  /** ticket id */ i: string;
  /** event slug */ e: string;
  /** tier id ("list" for free RSVPs) */ t: string;
  /** holder name */ n: string;
  /** guest id */ g: string;
  /** how they got in */ v: Via;
  /** admits (holder + plus-ones) */ q: number;
}

const secret = () => process.env.TICKET_SECRET ?? "dev-only-secret-set-TICKET_SECRET-in-production";

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest().subarray(0, 12).toString("base64url");
}

export function signTicket(c: TicketClaims): string {
  const body = Buffer.from(JSON.stringify(c)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Accepts a raw token or a ticket URL that contains one. */
export function verifyTicket(input: string): TicketClaims | null {
  const raw = decodeURIComponent(input.trim());
  const token = raw.includes("/t/") ? raw.slice(raw.lastIndexOf("/t/") + 3).split(/[?#]/)[0] : raw;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as TicketClaims;
    return typeof c.i === "string" && typeof c.e === "string" ? c : null;
  } catch {
    return null;
  }
}

export function newId(len: number): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return [...randomBytes(len)].map((b) => alphabet[b % alphabet.length]).join("");
}

export const isId = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9]{8,16}$/.test(v);

export function cleanName(v: unknown): string {
  return String(v ?? "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .trim()
    .slice(0, 40);
}
