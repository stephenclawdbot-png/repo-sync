import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryPanel, type PublicEvent } from "@/components/EntryPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { Ticket } from "@/components/Ticket";
import { counts } from "@/lib/core";
import { designVars, getEvent, paths, priceLine } from "@/lib/events";
import { isId } from "@/lib/token";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ev = getEvent((await params).slug);
  return ev ? { title: ev.title, description: ev.tagline } : {};
}

export default async function EventPage({ params, searchParams }: Props) {
  const ev = getEvent((await params).slug);
  if (!ev) notFound();
  const ref = (await searchParams).ref;
  const c = await counts(ev);
  const { doorCode: _door, ...pub } = ev;
  const publicEvent: PublicEvent = pub;
  const ways = paths(ev);

  return (
    <div className="themed ev-page" style={designVars(ev.design)}>
      <SiteHeader />
      <main id="main" className="wrap ev-layout">
        <div className="stack" style={{ "--gap": "26px" } as React.CSSProperties}>
          <div className="ev-hero">
            <div className="chips">
              <span className="chip">{ev.kind}</span>
              <span className="chip">Hosted by {ev.org.name}</span>
            </div>
            <h1>{ev.title}</h1>
            <p className="lede">{ev.tagline}</p>
          </div>

          <dl className="ev-facts">
            <div><dt>Date</dt><dd>{ev.dateLabel}</dd></div>
            <div><dt>Time</dt><dd>{ev.timeLabel}</dd></div>
            <div><dt>Where</dt><dd>{ev.venue}, {ev.city}</dd></div>
            <div><dt>Entry</dt><dd>{priceLine(ev)}</dd></div>
          </dl>

          <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{c.going.toLocaleString("en")} going{c.maybe ? ` · ${c.maybe} maybe` : ""}</strong>
              <span className="muted">
                {c.spotsLeft > 0 ? `${c.spotsLeft.toLocaleString("en")} of ${ev.capacity.toLocaleString("en")} spots left` : `Full · ${c.waitlist} on the waitlist`}
              </span>
            </div>
            <div className="meter" role="img" aria-label={`${Math.round((c.going / ev.capacity) * 100)} percent full`}>
              <span style={{ width: `${Math.min(100, (c.going / ev.capacity) * 100)}%` }} />
            </div>
          </div>

          <div className="stack">
            <h2 style={{ fontSize: "1.6rem" }}>About</h2>
            {ev.about.map((p) => <p key={p}>{p}</p>)}
          </div>

          <div className="stack">
            <h2 style={{ fontSize: "1.6rem" }}>Your ticket will look like this</h2>
            <p className="muted">
              {ways.length > 1 ? "Whichever way you get in, you" : "You"} get the same ticket: a QR for the door, a pass for
              your phone wallet, and a stub to keep once you’ve been scanned in.
            </p>
            <div style={{ maxWidth: 520 }}>
              <Ticket design={ev.design} kind={ev.kind} title={ev.title} dateLabel={`${ev.dateLabel} · ${ev.timeLabel}`} venue={ev.venue} org={ev.org.name} state="sample" />
            </div>
          </div>
        </div>

        <EntryPanel ev={publicEvent} refGid={isId(ref) ? ref : undefined} />
      </main>
    </div>
  );
}
