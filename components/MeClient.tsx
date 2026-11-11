"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { type Design, serial, type Via } from "@/lib/events";
import { useGuest } from "@/lib/guest";
import { Ticket } from "./Ticket";

interface Item {
  token: string;
  slug: string;
  state: "ticket" | "stub" | "cancelled";
  serial?: number;
  name: string;
  tier: string;
  via: Via;
  admits: number;
  startsAt: string;
  event: { title: string; kind: string; dateLabel: string; venue: string; design: Design };
}
interface Me { tickets: Item[]; points: { org: string; balance: number }[] }

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

export function MeClient() {
  const { guest, setName } = useGuest();
  const [me, setMe] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const gid = guest?.gid;
  const tokenKey = guest?.tickets.join("|");

  useEffect(() => {
    if (!guest) return;
    fetch("/api/me", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gid: guest.gid, tokens: guest.tickets }) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid, tokenKey]);

  if (failed) return <div className="note note--bad" role="alert"><strong>Couldn’t load your tickets</strong>Check your connection and reload the page.</div>;
  if (!me || !guest) return <p className="muted" aria-live="polite">Loading your tickets…</p>;

  const upcoming = me.tickets.filter((t) => t.state === "ticket").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const stubs = me.tickets.filter((t) => t.state === "stub").sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const totalPoints = me.points.reduce((n, p) => n + p.balance, 0);
  const p = guest.profile;

  function saveName(e: FormEvent) {
    e.preventDefault();
    if (draft.trim().length >= 2) setName(draft.trim().slice(0, 40));
    setEditing(false);
  }

  const render = (t: Item) => (
    <Link key={t.token} href={`/t/${t.token}`} aria-label={`${t.state === "stub" ? "Stub" : "Ticket"} for ${t.event.title}, ${t.event.dateLabel}. Open`}>
      <Ticket
        design={t.event.design}
        kind={t.event.kind}
        title={t.event.title}
        dateLabel={t.event.dateLabel}
        venue={t.event.venue}
        name={t.name}
        tier={t.tier}
        admits={t.admits}
        via={t.via}
        state={t.state === "stub" ? "stub" : "sample"}
        ticketNo="OPEN FOR QR"
        serial={t.serial ? serial(t.serial) : undefined}
      />
    </Link>
  );

  return (
    <>
      <section className="card stack" aria-label="Profile">
        {p ? (
          <>
            <div className="profile">
              <div className="avatar" aria-hidden="true">{initials(guest.name)}</div>
              <div>
                <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.4rem)" }}>{guest.name}</h2>
                <p className="muted">@{p.handle}{p.city ? ` · ${p.city}` : ""} · Member since {p.since}</p>
                {p.demo && <span className="chip chip--sky" style={{ marginTop: 8 }}>Demo account</span>}
              </div>
            </div>
            <div className="stats">
              <div><div className="num">{upcoming.length}</div><p className="muted">upcoming</p></div>
              <div><div className="num">{stubs.length}</div><p className="muted">stubs collected</p></div>
              <div><div className="num">{totalPoints}</div><p className="muted">points</p></div>
            </div>
            {editing ? (
              <form onSubmit={saveName} className="invite" style={{ maxWidth: 420 }}>
                <input type="text" aria-label="Your name" maxLength={40} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                <button className="btn btn--sm">Save</button>
              </form>
            ) : (
              <div><button className="btn btn--sm" onClick={() => { setDraft(guest.name); setEditing(true); }}>Edit name</button></div>
            )}
          </>
        ) : (
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p style={{ maxWidth: "52ch" }}><strong>Your tickets are saved on this device.</strong> Sign up to add a profile, or load the demo guest to see a full account.</p>
            <Link className="btn btn--ink" href="/signup">Sign up</Link>
          </div>
        )}
      </section>

      {me.points.length > 0 && (
        <section className="stack" aria-labelledby="pts-h">
          <h2 id="pts-h" style={{ fontSize: "1.8rem" }}>Points</h2>
          <div className="stats">
            {me.points.map((pt) => (
              <div className="card" key={pt.org}>
                <div className="num">{pt.balance}</div>
                <p className="muted">with {pt.org}</p>
              </div>
            ))}
          </div>
          {p?.demo && (
            <p className="hint">Try it: 300 points with Bayfront Collective buys a free ticket on the <Link href="/e/manila-sound-fest">Manila Sound Fest</Link> Earn tab.</p>
          )}
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
