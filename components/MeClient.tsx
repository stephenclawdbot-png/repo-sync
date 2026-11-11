"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEvent, serial, tierLabel, type Via } from "@/lib/events";
import { useGuest } from "@/lib/guest";
import { Ticket } from "./Ticket";

interface Item { token: string; slug: string; state: "ticket" | "stub" | "cancelled"; serial?: number; name: string; tier: string; via: Via; admits: number }
interface Me { tickets: Item[]; points: { org: string; balance: number }[] }

export function MeClient() {
  const { guest } = useGuest();
  const [me, setMe] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!guest) return;
    fetch("/api/me", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gid: guest.gid, tokens: guest.tickets }) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => setFailed(true));
  }, [guest]);

  if (failed) return <div className="note note--bad" role="alert"><strong>Couldn’t load your tickets</strong>Check your connection and reload the page.</div>;
  if (!me) return <p className="muted" aria-live="polite">Loading your tickets…</p>;

  const upcoming = me.tickets.filter((t) => t.state === "ticket");
  const stubs = me.tickets.filter((t) => t.state === "stub");

  const render = (t: Item) => {
    const ev = getEvent(t.slug)!;
    return (
      <Link key={t.token} href={`/t/${t.token}`} aria-label={`${t.state === "stub" ? "Stub" : "Ticket"} for ${ev.title}, open`}>
        <Ticket
          design={ev.design}
          kind={ev.kind}
          title={ev.title}
          dateLabel={ev.dateLabel}
          venue={ev.venue}
          name={t.name}
          tier={tierLabel(ev, t.tier)}
          admits={t.admits}
          via={t.via}
          state={t.state === "stub" ? "stub" : "sample"}
          ticketNo="OPEN FOR QR"
          serial={t.serial ? serial(t.serial) : undefined}
        />
      </Link>
    );
  };

  return (
    <>
      {me.points.length > 0 && (
        <section className="stack" aria-labelledby="pts-h">
          <h2 id="pts-h" style={{ fontSize: "1.8rem" }}>Points</h2>
          <div className="stats">
            {me.points.map((p) => (
              <div className="card" key={p.org}>
                <div className="num">{p.balance}</div>
                <p className="muted">with {p.org}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="stack" aria-labelledby="up-h">
        <h2 id="up-h" style={{ fontSize: "1.8rem" }}>Upcoming ({upcoming.length})</h2>
        {upcoming.length ? (
          <div className="coll">{upcoming.map(render)}</div>
        ) : (
          <div className="empty stack">
            <p>No tickets on this device yet.</p>
            <div><Link className="btn btn--ink" href="/#events">Find something to go to</Link></div>
          </div>
        )}
      </section>

      <section className="stack" aria-labelledby="st-h">
        <h2 id="st-h" style={{ fontSize: "1.8rem" }}>Stub collection ({stubs.length})</h2>
        {stubs.length ? (
          <div className="coll">{stubs.map(render)}</div>
        ) : (
          <div className="empty"><p>A ticket becomes a stub when it’s scanned at the door. Yours will collect here.</p></div>
        )}
      </section>
    </>
  );
}
