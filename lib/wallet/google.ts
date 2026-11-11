/**
 * Google Wallet "Save to Wallet" link for a ticket: a JWT signed by a service account.
 *
 * Needs a Google Wallet issuer account. Set:
 *   GOOGLE_WALLET_ISSUER_ID   numeric issuer id
 *   GOOGLE_WALLET_SA_EMAIL    service-account email with Wallet Object Issuer access
 *   GOOGLE_WALLET_SA_KEY      its private key (PEM text, or base64 of the PEM)
 */
import { createSign } from "node:crypto";
import { type EventDef, tierLabel } from "../events";
import type { TicketClaims } from "../token";

const KEYS = ["GOOGLE_WALLET_ISSUER_ID", "GOOGLE_WALLET_SA_EMAIL", "GOOGLE_WALLET_SA_KEY"] as const;

export const googleWalletReady = () => KEYS.every((k) => Boolean(process.env[k]));

const pem = (v: string) => (v.includes("-----BEGIN") ? v.replace(/\\n/g, "\n") : Buffer.from(v, "base64").toString());
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const text = (value: string) => ({ defaultValue: { language: "en-US", value } });

export function googleSaveUrl(ev: EventDef, c: TicketClaims, token: string, origin: string): string {
  const issuer = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const classId = `${issuer}.${ev.slug}`;
  const claims = {
    iss: process.env.GOOGLE_WALLET_SA_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [origin],
    payload: {
      eventTicketClasses: [
        {
          id: classId,
          issuerName: ev.org.name,
          reviewStatus: "UNDER_REVIEW",
          eventName: text(ev.title),
          venue: { name: text(ev.venue), address: text(`${ev.venue}, ${ev.city}`) },
          dateTime: { start: ev.startsAt, end: ev.endsAt },
          hexBackgroundColor: ev.design.paper,
        },
      ],
      eventTicketObjects: [
        {
          id: `${issuer}.${c.i}`,
          classId,
          state: "ACTIVE",
          ticketHolderName: c.n,
          ticketNumber: c.i.toUpperCase(),
          ticketType: text(tierLabel(ev, c.t)),
          barcode: { type: "QR_CODE", value: token, alternateText: c.i.toUpperCase() },
        },
      ],
    },
  };
  const head = `${b64({ alg: "RS256", typ: "JWT" })}.${b64(claims)}`;
  const sig = createSign("RSA-SHA256").update(head).sign(pem(process.env.GOOGLE_WALLET_SA_KEY!)).toString("base64url");
  return `https://pay.google.com/gw/apps/save/${head}.${sig}`;
}
