import Link from "next/link";
import type { ReactNode } from "react";
import { designVars, type EventDef, priceLine } from "@/lib/events";
import { SECTION_LABEL, type Merchant } from "@/lib/storefront";
import { Poster } from "./Poster";
import { Ticket } from "./Ticket";

type Ev = Pick<EventDef, "slug" | "title" | "kind" | "tagline" | "dateLabel" | "timeLabel" | "venue" | "city" | "rsvp" | "tiers" | "earn" | "currency">;

interface Props {
  merchant: Pick<Merchant, "name" | "handle" | "storefront">;
  events: Ev[];
  /** Inside the back-office preview: links are inert. */
  preview?: boolean;
}

/** A merchant's public storefront. The same component renders the live page and the editor preview. */
export function StorefrontView({ merchant, events, preview }: Props) {
  const sf = merchant.storefront;
  const d = sf.design;
  const A = ({ href, className, children }: { href: string; className?: string; children: ReactNode }) =>
    preview ? <span className={className}>{children}</span> : <Link href={href} className={className}>{children}</Link>;
  const H = preview ? "p" : "h1";
  const dayMonth = (e: Ev) => e.dateLabel.split(" ").slice(1, 3).join(" ");

  const sections: Record<string, ReactNode> = {
    events: (
      <section className="sf__section" id="events" key="events" aria-label="Events">
        <h2>What’s on</h2>
        {events.length === 0 ? (
          <div className="empty"><p>No events yet. New ones show up here as soon as they’re published.</p></div>
        ) : sf.cards === "list" ? (
          <div className="sf__list">
            {events.map((e) => (
              <A key={e.slug} href={`/e/${e.slug}`} className="sf__row">
                <span className="mono">{e.dateLabel}</span>
                <span><strong>{e.title}</strong><br /><span className="muted">{e.venue}, {e.city}</span></span>
                <span style={{ fontWeight: 650 }}>{priceLine(e as EventDef)} →</span>
              </A>
            ))}
          </div>
        ) : sf.cards === "poster" ? (
          <div className="sf__posters">
            {events.map((e) => (
              <A key={e.slug} href={`/e/${e.slug}`} className="sf__poster-card">
                <Poster design={d} kind={e.kind} big={dayMonth(e)} small />
                <h3>{e.title}</h3>
                <p className="muted">{e.tagline}</p>
                <p style={{ fontWeight: 650, fontSize: "0.92rem" }}>{priceLine(e as EventDef)}</p>
              </A>
            ))}
          </div>
        ) : (
          <div className="events">
            {events.map((e) => {
              const [dow, day, month] = e.dateLabel.split(" ");
              return (
                <A key={e.slug} href={`/e/${e.slug}`} className="ev-card">
                  <div className="ev-card__date">
                    <span className="mono">{month}</span>
                    <span className="ev-card__day">{day}</span>
                    <span className="mono">{dow}</span>
                  </div>
                  <div className="ev-card__body">
                    <span className="mono">{e.kind} · {e.city}</span>
                    <h3>{e.title}</h3>
                    <p className="muted">{e.tagline}</p>
                    <p className="ev-card__foot">{priceLine(e as EventDef)}</p>
                  </div>
                </A>
              );
            })}
          </div>
        )}
      </section>
    ),
    about: sf.about ? (
      <section className="sf__section" id="about" key="about" aria-label="About">
        <h2>About {merchant.name}</h2>
        <p className="lede" style={{ maxWidth: "62ch" }}>{sf.about}</p>
      </section>
    ) : null,
    ways: (
      <section className="sf__section" key="ways" aria-label="Ways in">
        <h2>Three ways in</h2>
        <div className="grid-3">
          <div className="card"><span className="chip chip--mint">RSVP</span><p style={{ marginTop: 10 }}>Free events take one tap. No account, no app.</p></div>
          <div className="card"><span className="chip chip--marigold">Buy</span><p style={{ marginTop: 10 }}>Pay with GCash, Maya, QR, card or PayPal.</p></div>
          <div className="card"><span className="chip chip--salmon">Earn</span><p style={{ marginTop: 10 }}>Bring friends and show up. Points become tickets and perks.</p></div>
        </div>
      </section>
    ) ,
    stubs: (
      <section className="sf__section" key="stubs" aria-label="Stubs">
        <h2>Keep the stub</h2>
        <p className="muted" style={{ maxWidth: "58ch" }}>Every ticket turns into a numbered stub when it’s scanned at the door. Collect ours.</p>
        <div style={{ maxWidth: 480 }} aria-hidden="true">
          <Ticket design={d} kind={events[0]?.kind ?? "Event"} title={events[0]?.title ?? merchant.name} dateLabel={events[0]?.dateLabel ?? "Coming soon"} venue={events[0]?.venue ?? "To be announced"} org={merchant.name} state="stub" serial="0042" />
        </div>
      </section>
    ),
  };

  // The live page uses real landmarks; the editor preview uses plain blocks so it does not nest landmarks.
  const Head = preview ? "div" : "header";
  const Main = preview ? "div" : "main";
  const Foot = preview ? "div" : "footer";

  return (
    <div className="themed sf" data-corners={sf.corners} data-hero={sf.hero} style={designVars(d)}>
      <Head>
        {sf.announcement && <p className="sf__bar">{sf.announcement}</p>}
        <div className="wrap sf__top">
          <A href={`/s/${merchant.handle}`} className="sf__brand"><span aria-hidden="true">{d.glyph}</span>{merchant.name}</A>
          <nav className="site-nav" aria-label={preview ? "Storefront preview" : "Storefront"}>
            {sf.sections.filter((s) => s.on && (s.id === "events" || (s.id === "about" && sf.about))).map((s) => (
              <A key={s.id} href={`#${s.id}`}>{SECTION_LABEL[s.id]}</A>
            ))}
            <A href="/me">My tickets</A>
          </nav>
        </div>
      </Head>

      <Main id={preview ? undefined : "main"} className="wrap">
        <div className={`sf__hero ${sf.hero === "banner" ? "poster" : ""}`} data-pattern={sf.hero === "banner" ? d.pattern : undefined}>
          {sf.hero === "banner" && <span className="poster__glyph" aria-hidden="true">{d.glyph}</span>}
          <H className="sf__name">{merchant.name}</H>
          {sf.tagline && <p className="lede">{sf.tagline}</p>}
          <div><A href="#events" className="btn btn--ink">See what’s on</A></div>
        </div>
        {sf.sections.filter((s) => s.on).map((s) => sections[s.id])}
      </Main>

      <Foot className="wrap sf__foot">
        <span>© {merchant.name}</span>
        <A href="/">Tickets by stagepass</A>
      </Foot>
    </div>
  );
}
