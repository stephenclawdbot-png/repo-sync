import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Ticket } from "@/components/Ticket";
import { designVars, getEvent, priceLine, UPCOMING } from "@/lib/events";

const KINDS = ["House parties", "Run clubs", "Concerts", "Meetups", "Workshops", "Weddings", "Fun runs", "Conferences", "Reunions"];

const SAMPLES = ["manila-sound-fest", "sunday-run-club", "rooftop-housewarming", "build-night", "wheel-throwing-101", "kanto-night-market", "lia-and-marco"];

function sample(i: number) {
  const e = getEvent(SAMPLES[i])!;
  return { design: e.design, kind: e.kind, title: e.title, dateLabel: e.dateLabel, venue: e.venue };
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="wrap hero">
          <div className="stack" style={{ "--gap": "22px" } as React.CSSProperties}>
            <p className="mono">Admit everyone</p>
            <h1>
              <span className="hl-mint">RSVP</span> it. <span className="hl-marigold">Buy</span> it.{" "}
              <span className="hl-salmon">Earn</span> it. Keep the <span className="hl-sky">stub</span>.
            </h1>
            <p className="lede">
              One guest list for any gathering. People get in free, with a paid ticket, or by earning one. Everyone gets a QR
              for the door, and a stub to keep after.
            </p>
            <div className="row">
              <Link className="btn btn--ink" href="#events">Find something to go to</Link>
              <Link className="btn" href="/signup">Sign up or try a demo</Link>
            </div>
          </div>
          <div className="fan" aria-hidden="true">
            <Ticket {...sample(2)} state="sample" />
            <Ticket {...sample(0)} state="sample" />
            <Ticket {...sample(1)} state="sample" />
          </div>
        </div>

        <div className="wrap">
          <p className="kinds" aria-label="Works for">{KINDS.map((k) => <span key={k}>{k}</span>)}</p>
        </div>

        <section className="wrap section" id="ways" aria-labelledby="ways-h">
          <div className="section__head">
            <p className="mono">Three ways in</p>
            <h2 id="ways-h">Every guest ends up with the same ticket.</h2>
            <p className="lede">Hosts choose which doors are open. One event can use all three.</p>
          </div>
          <div className="ways">
            <article className="way way--mint">
              <span className="mono">01 · Free</span>
              <h3>RSVP</h3>
              <p>Say going, maybe or can’t go. Bring plus-ones, answer the host’s questions, and join the waitlist if it’s full.</p>
              <ul><li>No account, no app</li><li>Capacity and waitlist handled for you</li></ul>
            </article>
            <article className="way way--marigold">
              <span className="mono">02 · Paid</span>
              <h3>Buy</h3>
              <p>Pick a ticket and pay the way you already do: GCash, Maya, QR, cards or PayPal.</p>
              <ul><li>Local payment methods first</li><li>Hosts get paid as they sell</li></ul>
            </article>
            <article className="way way--salmon">
              <span className="mono">03 · Points</span>
              <h3>Earn</h3>
              <p>Bring friends, show up, keep coming back. Points turn into a free ticket, a fast lane or a coffee.</p>
              <ul><li>Points land when friends are scanned in</li><li>Hosts cap what they give away</li></ul>
            </article>
          </div>
        </section>

        <section className="wrap section" id="events" aria-labelledby="events-h" style={{ paddingTop: 0 }}>
          <div className="section__head">
            <p className="mono">Try it</p>
            <h2 id="events-h">Sample events, real flow.</h2>
            <p className="lede">A wedding, a night market, a conference, a run club. Each is set up differently. RSVP, buy or earn, then scan your own ticket with the door scanner.</p>
          </div>
          <div className="events">
            {UPCOMING.map((e) => {
              const [, day, month] = e.dateLabel.split(" ");
              return (
                <Link key={e.slug} href={`/e/${e.slug}`} className="ev-card themed" style={designVars(e.design)}>
                  <div className="ev-card__date">
                    <span className="mono">{month}</span>
                    <span className="ev-card__day">{day}</span>
                    <span className="mono">{e.dateLabel.split(" ")[0]}</span>
                  </div>
                  <div className="ev-card__body">
                    <span className="mono">{e.kind} · {e.city}</span>
                    <h3>{e.title}</h3>
                    <p className="muted">{e.tagline}</p>
                    <p className="ev-card__foot">{priceLine(e)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="band band--sky" id="stubs" aria-labelledby="stubs-h">
          <div className="wrap section split">
            <div className="stack" style={{ "--gap": "18px" } as React.CSSProperties}>
              <p className="mono">After the door scan</p>
              <h2 id="stubs-h">The ticket tears. The stub is yours.</h2>
              <p className="lede">When a ticket is scanned it turns into a numbered stub: proof you were there, in the host’s own design.</p>
              <ul className="checks">
                <li>Numbered in the order people walked in</li>
                <li>Collected on your phone and in your wallet pass</li>
                <li>Counts toward rewards and early access next time</li>
                <li>No crypto wallet, no sign-up</li>
              </ul>
              <div><Link className="btn btn--ink" href="/me">See my collection</Link></div>
            </div>
            <div className="stub-pile" aria-hidden="true">
              <Ticket {...sample(0)} name="Mika R." tier="General Admission" state="stub" serial="0421" />
              <Ticket {...sample(3)} name="Mika R." tier="Guest list" state="stub" serial="0017" />
            </div>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="yours-h">
          <div className="section__head">
            <p className="mono">Make it yours</p>
            <h2 id="yours-h">One design for the page, the ticket and the stub.</h2>
            <p className="lede">Colours, type, pattern and mark. The studio checks your colours stay readable for everyone.</p>
          </div>
          <div className="grid-3" aria-hidden="true">
            <Ticket {...sample(5)} state="sample" />
            <Ticket {...sample(6)} state="sample" />
            <Ticket {...sample(3)} state="sample" />
          </div>
          <div className="row" style={{ marginTop: 28 }}>
            <Link className="btn btn--ink" href="/studio">Open the design studio</Link>
            <Link className="btn" href="/s/bayfront">See a merchant storefront</Link>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="easy-h" style={{ paddingTop: 0 }}>
          <div className="section__head">
            <p className="mono">Ease of access</p>
            <h2 id="easy-h">Easy for every guest, on any phone.</h2>
          </div>
          <div className="grid-3">
            <div className="card"><h3>No app, no account</h3><p className="muted">A link is enough. Tickets are saved on the phone that RSVP’d.</p></div>
            <div className="card"><h3>In your phone wallet</h3><p className="muted">Apple Wallet and Google Wallet passes, plus add-to-calendar.</p></div>
            <div className="card"><h3>Big, bright QR</h3><p className="muted">A full-screen code for cracked screens and dim doorways, with a typed fallback.</p></div>
            <div className="card"><h3>Readable by design</h3><p className="muted">High contrast, large touch targets, keyboard and screen-reader support on every page.</p></div>
            <div className="card"><h3>Works on weak signal</h3><p className="muted">Light pages, and a ticket that still shows once it has loaded.</p></div>
            <div className="card"><h3>Pay your way</h3><p className="muted">Local e-wallets and QR payments sit ahead of cards.</p></div>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="demo-h" style={{ paddingTop: 0 }}>
          <div className="section__head">
            <p className="mono">Signed-in demos</p>
            <h2 id="demo-h">See both sides with an account that already has history.</h2>
          </div>
          <div className="choice">
            <div className="card">
              <span className="chip chip--mint choice__tag">Guest</span>
              <h3>Mika Reyes</h3>
              <p className="muted">A profile with three upcoming tickets, three stubs and enough points to claim a free concert ticket.</p>
              <div><Link className="btn btn--mint" href="/signup">Open the guest demo</Link></div>
            </div>
            <div className="card">
              <span className="chip chip--marigold choice__tag">Merchant</span>
              <h3>Likha Weekend Market</h3>
              <p className="muted">A back office with three events and a guest list filling up, plus a storefront you can restyle and publish.</p>
              <div><Link className="btn btn--marigold" href="/signup">Open the merchant demo</Link></div>
            </div>
          </div>
        </section>

        <section className="band band--ink" aria-labelledby="org-h">
          <div className="wrap section stack" style={{ "--gap": "18px" } as React.CSSProperties}>
            <h2 id="org-h" style={{ maxWidth: "18ch" }}>Hosting something?</h2>
            <p style={{ maxWidth: "54ch", fontSize: "1.15rem" }}>See a live guest list, how people got in, what the rewards cost you, and when you get paid.</p>
            <div className="row">
              <Link className="btn btn--marigold" href="/organizers">For organizers</Link>
              <Link className="btn btn--mint" href="/host/manila-sound-fest">Open a host dashboard</Link>
              <Link className="btn btn--sky" href="/scan">Door scanner</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
