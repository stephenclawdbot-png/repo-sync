"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGuest } from "@/lib/guest";

interface Props {
  token: string;
  slug: string;
  qrSvg: string;
  isStub: boolean;
  apple: boolean;
  google: boolean;
  inviteGid?: string;
  eventTitle: string;
}

export function TicketActions({ token, slug, qrSvg, isStub, apple, google, inviteGid, eventTitle }: Props) {
  const router = useRouter();
  const { guest, addTicket } = useGuest();
  const [bright, setBright] = useState(false);
  const [note, setNote] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const saved = useRef(false);

  // Keep the ticket on this device, even if the link was opened from a message.
  useEffect(() => {
    if (guest && !saved.current) {
      saved.current = true;
      if (!guest.tickets.includes(token)) addTicket(token);
    }
  }, [guest, token, addTicket]);

  // While the ticket is unscanned, check every few seconds so it turns into a stub the moment the door scans it.
  useEffect(() => {
    if (isStub) return;
    const t = setInterval(async () => {
      if (document.hidden) return;
      const r = await fetch(`/api/ticket-status?token=${encodeURIComponent(token)}`).catch(() => null);
      if (r?.ok && (await r.json()).checkedIn) router.refresh();
    }, 4000);
    return () => clearInterval(t);
  }, [isStub, token, router]);

  useEffect(() => {
    if (!bright) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBright(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bright]);

  async function share() {
    const url = `${window.location.origin}/e/${slug}?ref=${inviteGid}`;
    try {
      if (navigator.share) await navigator.share({ title: eventTitle, url });
      else {
        await navigator.clipboard.writeText(url);
        setNote("Invite link copied. You earn points when a friend who used it is scanned in.");
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  const q = encodeURIComponent(token);
  return (
    <div className="stack">
      {isStub ? (
        <div className="note note--ok">
          <strong>Stub saved to your collection.</strong>
          It stays on this device and in your wallet pass.
        </div>
      ) : (
        <p className="muted" style={{ textAlign: "center" }}>Show this QR at the door. This page turns into your stub when you’re scanned in.</p>
      )}

      <div className="actions">
        {!isStub && (
          <button className="btn btn--primary" onClick={() => setBright(true)}>
            Enlarge QR
          </button>
        )}
        {apple ? (
          <a className="btn" href={`/api/passes/apple?token=${q}`}>Add to Apple Wallet</a>
        ) : (
          <button className="btn" aria-disabled="true" onClick={() => setNote("Apple Wallet isn’t switched on yet. It needs the organizer’s Apple pass certificate; until then, save this page or add the event to your calendar.")}>
            Add to Apple Wallet
          </button>
        )}
        {google ? (
          <a className="btn" href={`/api/passes/google?token=${q}`}>Add to Google Wallet</a>
        ) : (
          <button className="btn" aria-disabled="true" onClick={() => setNote("Google Wallet isn’t switched on yet. It needs a Google Wallet issuer account; until then, save this page or add the event to your calendar.")}>
            Add to Google Wallet
          </button>
        )}
        {!isStub && <a className="btn" href={`/api/ics?slug=${slug}`}>Add to calendar</a>}
        {inviteGid && !isStub && <button className="btn" onClick={share}>Invite a friend, earn points</button>}
        <Link className="btn" href="/me">{isStub ? "See my stubs" : "All my tickets"}</Link>
      </div>
      <p className="hint" aria-live="polite">{note || (!apple || !google ? "Wallet passes switch on once Apple and Google wallet credentials are added. Add to calendar works now." : "")}</p>

      {bright && (
        <div className="bright" role="dialog" aria-modal="true" aria-label="Ticket QR code, full screen">
          <div>
            <div className="bright__qr" role="img" aria-label="QR code for this ticket" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p style={{ marginTop: 12, fontWeight: 650 }}>Turn your screen brightness up if the scanner struggles.</p>
            <button ref={closeRef} className="btn" style={{ background: "#fff", color: "#000", borderColor: "#000", marginTop: 18 }} onClick={() => setBright(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
