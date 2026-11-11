import { findEvent } from "@/lib/merchants";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Ticket } from "@/components/Ticket";
import { TicketActions } from "@/components/TicketActions";
import { checkInStatus, existingTicket } from "@/lib/core";
import { designVars, serial, tierLabel } from "@/lib/events";
import { qrSvg } from "@/lib/qr";
import { verifyTicket } from "@/lib/token";
import { appleWalletReady } from "@/lib/wallet/apple";
import { googleWalletReady } from "@/lib/wallet/google";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const token = decodeURIComponent((await params).token);
  const claims = verifyTicket(token);
  const ev = claims && (await findEvent(claims.e));

  if (!claims || !ev) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="wrap section stack">
          <h1 className="h-app">This ticket link isn’t valid</h1>
          <p className="lede">The link may have been cut short when it was copied. Open it again from where you saved it, or check your tickets on this device.</p>
          <div><Link className="btn btn--primary" href="/me">My tickets</Link></div>
        </main>
      </>
    );
  }

  const [held, scanned, qr] = await Promise.all([existingTicket(ev, claims.g), checkInStatus(ev, claims.i), qrSvg(token)]);
  const cancelled = !scanned && held?.tid !== claims.i;
  const admits = held?.admits ?? claims.q;
  const state = scanned ? "stub" : "ticket";

  return (
    <div className="themed tk-page" style={designVars(ev.design)}>
      <SiteHeader />
      <main id="main" className="tk-page__inner stack" style={{ "--gap": "22px" } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
                    <h1 className="h-app">{scanned ? "You were there." : cancelled ? "This ticket was cancelled" : `See you at ${ev.title}.`}</h1>
          {scanned && <p className="lede">Scanned in as guest No. {serial(scanned.serial)}. The ticket is now a stub, and it’s yours to keep.</p>}
          {cancelled && <p className="lede">The RSVP for this ticket was changed, so it won’t scan at the door. RSVP again to get a new one.</p>}
        </div>

        {!cancelled && (
          <Ticket
            design={ev.design}
            kind={ev.kind}
            title={ev.title}
            dateLabel={`${ev.dateLabel} · ${ev.timeLabel}`}
            venue={`${ev.venue}, ${ev.city}`}
            org={ev.org.name}
            name={claims.n}
            tier={tierLabel(ev, held?.tier ?? claims.t)}
            admits={admits}
            via={held?.via ?? claims.v}
            state={state}
            qrSvg={qr}
            ticketNo={claims.i.toUpperCase()}
            serial={scanned ? serial(scanned.serial) : undefined}
            fresh={Boolean(scanned && Date.now() - scanned.at < 20000)}
          />
        )}

        {cancelled ? (
          <div><Link className="btn btn--primary" href={`/e/${ev.slug}`}>Back to the event</Link></div>
        ) : (
          <TicketActions
            token={token}
            slug={ev.slug}
            qrSvg={qr}
            isStub={Boolean(scanned)}
            apple={appleWalletReady()}
            google={googleWalletReady()}
            inviteGid={ev.earn ? claims.g : undefined}
            eventTitle={ev.title}
          />
        )}
      </main>
    </div>
  );
}
