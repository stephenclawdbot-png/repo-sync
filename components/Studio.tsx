"use client";

import Link from "next/link";
import { useState } from "react";
import { type Design, designVars, EVENTS } from "@/lib/events";
import { DesignControls } from "./DesignControls";
import { Ticket } from "./Ticket";

export function Studio() {
  const [title, setTitle] = useState("Your Event Name");
  const [kind, setKind] = useState("Party");
  const [date, setDate] = useState("Sat 14 Mar 2027 · 8:00 PM");
  const [venue, setVenue] = useState("The Venue");
  const [d, setD] = useState<Design>(EVENTS[2].design);
  const common = { design: d, kind, title, dateLabel: date, venue, org: "Your name here" };

  return (
    <div className="studio">
      <form className="card stack" onSubmit={(e) => e.preventDefault()} aria-label="Design controls">
        <div className="field"><label htmlFor="st-title">Event name</label><input id="st-title" type="text" maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label htmlFor="st-kind">Kind</label><input id="st-kind" type="text" maxLength={20} value={kind} onChange={(e) => setKind(e.target.value)} /></div>
        <div className="field"><label htmlFor="st-date">Date and time</label><input id="st-date" type="text" maxLength={40} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label htmlFor="st-venue">Where</label><input id="st-venue" type="text" maxLength={40} value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
        <DesignControls design={d} onChange={setD} />
        <p className="hint">This is a playground. To publish a storefront and events with your design, sign up as a merchant.</p>
        <Link className="btn btn--primary" href="/signup">Sign up to publish</Link>
      </form>

      <div className="studio__preview" aria-label="Live preview">
        <div>
          <p className="mono" style={{ marginBottom: 8 }}>Event page</p>
          <div className="themed mini-page" style={designVars(d)}>
            <span className="chip">{kind}</span>
            <p className="mini-page__title">{title}</p>
            <p className="muted">{date} · {venue}</p>
            <div className="row" style={{ marginTop: 14 }}>
              <span className="btn btn--sm" style={{ background: "var(--e-accent)", color: "var(--e-on-accent)" }}>RSVP</span>
              <span className="btn btn--sm">Buy</span>
              <span className="btn btn--sm">Earn</span>
            </div>
          </div>
        </div>
        <div>
          <p className="mono" style={{ marginBottom: 8 }}>Ticket</p>
          <Ticket {...common} name="Guest Name" tier="Guest list" state="sample" />
        </div>
        <div>
          <p className="mono" style={{ marginBottom: 8 }}>Stub, after the door scan</p>
          <Ticket {...common} name="Guest Name" tier="Guest list" state="stub" serial="0042" />
        </div>
      </div>
    </div>
  );
}
