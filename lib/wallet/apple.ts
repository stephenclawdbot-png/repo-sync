/**
 * Apple Wallet pass (.pkpass) for a ticket.
 *
 * Needs an Apple Developer account. Set these environment variables (PEM text, or base64 of the PEM):
 *   APPLE_PASS_TYPE_ID   e.g. pass.app.stagepass.ticket
 *   APPLE_TEAM_ID        10-character team id
 *   APPLE_PASS_CERT      Pass Type ID certificate
 *   APPLE_PASS_KEY       its private key   (APPLE_PASS_KEY_PASSPHRASE if encrypted)
 *   APPLE_WWDR_CERT      Apple WWDR intermediate certificate (G4)
 * Without them the route answers 501 and the button explains what is missing.
 */
import { PKPass } from "passkit-generator";
import { readableOn } from "../contrast";
import { type EventDef, tierLabel, VIA_LABEL } from "../events";
import { iconPng } from "../png";
import type { TicketClaims } from "../token";

const KEYS = ["APPLE_PASS_TYPE_ID", "APPLE_TEAM_ID", "APPLE_PASS_CERT", "APPLE_PASS_KEY", "APPLE_WWDR_CERT"] as const;

export const appleWalletReady = () => KEYS.every((k) => Boolean(process.env[k]));

const pem = (v: string) => (v.includes("-----BEGIN") ? v.replace(/\\n/g, "\n") : Buffer.from(v, "base64").toString());
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

export function buildApplePass(ev: EventDef, c: TicketClaims, token: string, attendedSerial?: string): Buffer {
  const env = process.env as unknown as Record<(typeof KEYS)[number] | "APPLE_PASS_KEY_PASSPHRASE", string>;
  const text = readableOn(ev.design.paper, [ev.design.ink, "#ffffff", "#17140f"]);
  const icon = (px: number) => iconPng(px, ev.design.paper, ev.design.accent);

  const pass = new PKPass(
    {
      "icon.png": icon(29),
      "icon@2x.png": icon(58),
      "icon@3x.png": icon(87),
      "logo.png": icon(50),
      "logo@2x.png": icon(100),
    },
    {
      wwdr: pem(env.APPLE_WWDR_CERT),
      signerCert: pem(env.APPLE_PASS_CERT),
      signerKey: pem(env.APPLE_PASS_KEY),
      signerKeyPassphrase: env.APPLE_PASS_KEY_PASSPHRASE || undefined,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: env.APPLE_PASS_TYPE_ID,
      teamIdentifier: env.APPLE_TEAM_ID,
      organizationName: ev.org.name,
      serialNumber: c.i,
      description: `${ev.title} ticket`,
      logoText: "Stagepass",
      backgroundColor: rgb(ev.design.paper),
      foregroundColor: rgb(text),
      labelColor: rgb(text),
    },
  );

  pass.type = "eventTicket";
  pass.primaryFields.push({ key: "event", label: ev.kind.toUpperCase(), value: ev.title });
  pass.secondaryFields.push(
    { key: "date", label: "DATE", value: `${ev.dateLabel}, ${ev.timeLabel}` },
    { key: "venue", label: "VENUE", value: ev.venue },
  );
  pass.auxiliaryFields.push(
    { key: "name", label: "NAME", value: c.n },
    { key: "tier", label: "TICKET", value: tierLabel(ev, c.t) },
    { key: "admits", label: "ADMITS", value: String(c.q) },
    attendedSerial
      ? { key: "stub", label: "STUB", value: `Attended · No. ${attendedSerial}` }
      : { key: "via", label: "WAY IN", value: VIA_LABEL[c.v] },
  );
  pass.backFields.push(
    { key: "where", label: "Where", value: `${ev.venue}, ${ev.city}` },
    { key: "host", label: "Hosted by", value: ev.org.name },
    { key: "about", label: "About", value: ev.about.join("\n\n") },
  );
  pass.setBarcodes({ message: token, format: "PKBarcodeFormatQR", messageEncoding: "iso-8859-1", altText: c.i.toUpperCase() });
  pass.setRelevantDate(new Date(ev.startsAt));
  pass.setExpirationDate(new Date(new Date(ev.endsAt).getTime() + 365 * 864e5));
  return pass.getAsBuffer();
}
