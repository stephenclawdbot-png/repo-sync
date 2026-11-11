import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Ticket } from "@/components/Ticket";
import { getEvent, UPCOMING } from "@/lib/events";

function sample(slug: string) {
  const e = getEvent(slug)!;
  return { design: e.design, kind: e.kind, title: e.title, dateLabel: e.dateLabel, venue: e.venue, org: e.org.name };
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="wrap hero">
          <div className="stack" style={{ "--gap": "22px" } as React.CSSProperties}>
            <h1>
              <span style={{ display: "block" }}>Every way in.</span>
              <span className="hero__em" style={{ display: "block" }}>One pass.</span>
            </h1>
            <p className="lede">RSVP, buy, or earn your spot at any event. Scan in at the door, and keep the stub.</p>
            <div className="row">
              <Link className="btn btn--primary btn--lg" href="#events">Find an event</Link>
              <Link className="btn btn--lg" href="/signup">Host an event</Link>
              <Link className="btn btn--lg btn--ghost" href="/demo">▶ Watch the demo</Link>
            </div>
            <ul className="trust">
              <li>No app or account needed</li>
              <li>GCash, Maya, QR and cards</li>
              <li>Apple and Google Wallet</li>
            </ul>
          </div>
          <div className="hero__art" aria-hidden="true">
            <Ticket {...sample("manila-sound-fest")} name="Mika Reyes" tier="General Admission" via="earn" state="sample" sideNote="No. 7KQ2M9XA4P" />
            <Ticket {...sample("kanto-night-market")} name="Mika Reyes" tier="Guest list" state="stub" serial="0212" />
          </div>
        </div>

        <section className="wrap section section--tight" id="events" aria-labelledby="events-h">
          <div className="section__head">
            <h2 id="events-h">What’s on</h2>
            <p className="lede">Sample events, real flow: get a pass, then scan it yourself with the door scanner.</p>
          </div>
          <div className="events events--rail">
            {UPCOMING.slice(0, 9).map((e) => <EventCard key={e.slug} ev={e} />)}
          </div>
        </section>

        <section className="band" id="ways" aria-labelledby="ways-h">
          <div className="wrap section">
            <div className="section__head">
              <h2 id="ways-h">Three ways in, one guest list</h2>
              <p className="lede">Hosts choose which doors are open. Every guest ends up with the same pass.</p>
            </div>
            <div className="ways">
              <article className="way way--rsvp">
                <span className="way__icon" aria-hidden="true">1</span>
                <h3>RSVP</h3>
                <p>Free. Say going, maybe or can’t go, bring plus-ones, and join the waitlist if it’s full.</p>
              </article>
              <article className="way way--buy">
                <span className="way__icon" aria-hidden="true">2</span>
                <h3>Buy</h3>
                <p>Pick a ticket and pay the way you already do: GCash, Maya, QR, card or PayPal.</p>
              </article>
              <article className="way way--earn">
                <span className="way__icon" aria-hidden="true">3</span>
                <h3>Earn</h3>
                <p>Bring friends and show up. Points become a free ticket, a fast lane or a coffee.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="wrap section split" id="stubs" aria-labelledby="stubs-h">
          <div className="stack" style={{ "--gap": "18px" } as React.CSSProperties}>
            <h2 id="stubs-h">You’re in. The stub is yours.</h2>
            <p className="lede">When your pass is scanned, it tears into a numbered stub in the host’s own design.</p>
            <ul className="checks">
              <li>Numbered in the order people walked in</li>
              <li>Saved on your phone and in your wallet pass</li>
              <li>Counts toward rewards and early access next time</li>
            </ul>
            <div><Link className="btn" href="/me">See my collection</Link></div>
          </div>
          <div aria-hidden="true" style={{ maxWidth: 360, width: "100%", justifySelf: "center" }}>
            <Ticket {...sample("build-night")} name="Mika Reyes" tier="Guest list" via="rsvp" state="stub" serial="0017" />
          </div>
        </section>

        <section className="band" aria-labelledby="org-h">
          <div className="wrap section">
            <div className="section__head">
              <h2 id="org-h">Hosting? Make it look like yours.</h2>
              <p className="lede">One design drives your storefront, event pages, passes and stubs. You also get a live guest list, a door scanner on any phone, and rewards with a budget.</p>
            </div>
            <div className="grid-3" aria-hidden="true">
              <Ticket {...sample("lia-and-marco")} state="sample" />
              <Ticket {...sample("shipyard-conf-2027")} state="sample" />
              <Ticket {...sample("open-mic-sa-likod")} state="sample" />
            </div>
            <div className="row" style={{ marginTop: 32 }}>
              <Link className="btn btn--primary" href="/signup">Start hosting</Link>
              <Link className="btn" href="/s/bayfront">See a storefront</Link>
              <Link className="btn" href="/organizers">How it works for organizers</Link>
            </div>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="demo-h">
          <div className="section__head">
            <h2 id="demo-h">Try it with an account that already has history</h2>
          </div>
          <div className="choice">
            <div className="card">
              <span className="chip chip--rsvp choice__tag">Guest demo</span>
              <h3>Mika Reyes</h3>
              <p className="muted">Three upcoming passes, three stubs, and enough points to claim a free concert ticket.</p>
              <div><Link className="btn" href="/signup">Open the guest demo</Link></div>
            </div>
            <div className="card">
              <span className="chip chip--buy choice__tag">Merchant demo</span>
              <h3>Likha Weekend Market</h3>
              <p className="muted">A back office with three events and a guest list filling up, plus a storefront to restyle.</p>
              <div><Link className="btn" href="/signup">Open the merchant demo</Link></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
