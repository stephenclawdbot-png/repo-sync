import Link from "next/link";
import { Nav } from "@/components/Nav";

const GATEWAYS = [
  { region: "Philippines", methods: ["GCash", "Maya", "QR Ph", "GrabPay", "Cards", "PayPal"], via: "PayMongo · Xendit" },
  { region: "Indonesia", methods: ["QRIS", "Cards", "PayPal"], via: "Xendit" },
  { region: "Malaysia", methods: ["DuitNow", "GrabPay", "Cards"], via: "Xendit · Stripe" },
  { region: "Thailand", methods: ["PromptPay", "Cards"], via: "Xendit · Stripe" },
  { region: "Singapore", methods: ["PayNow", "Apple Pay", "Cards"], via: "Stripe" },
  { region: "Global", methods: ["Cards", "Apple Pay", "Google Pay", "PayPal"], via: "Stripe · PayPal" },
];

const DIAGRAM = `Buyers / Organizers / Embeds
        │
  Edge (Vercel): storefront ISR · custom domains · WAF · waiting room
        │
  API / BFF: auth · rate limits · idempotency keys
        │
  ┌─────────┬────────────┬──────────┬─────────────┬─────────┬──────────┐
  Catalog   Inventory    Checkout   Payment       Ledger    Payouts
  & themes  & seat holds saga       orchestrator  (double-  & risk
                                    (adapters)    entry)    reserve
        │
  Outbox → Event bus → tickets · notifications · webhooks · analytics
        │
  Postgres · Redis · object storage · warehouse
  Stripe · PayMongo · Xendit · PayPal · bank rails (InstaPay, FAST, DuitNow)`;

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <div className="wrap hero">
          <span className="eyebrow">Event ticketing for Southeast Asia and beyond</span>
          <h1>Your brand. Every payment method. Your money tomorrow.</h1>
          <p className="lede">
            Stagepass gives organizers a fully branded storefront, a checkout that accepts the wallets buyers actually use,
            and payouts that arrive the day after each sale, not weeks after your event.
          </p>
          <div className="cta-row">
            <Link className="btn primary" href="/e/manila-sound-fest">
              Try the demo storefront →
            </Link>
            <Link className="btn" href="/dashboard">
              Simulate your payouts
            </Link>
          </div>
        </div>

        <section className="wrap">
          <div className="grid3">
            <div className="card">
              <div className="kpi">Your design</div>
              <h3>Storefronts you control</h3>
              <p>Themes, layout blocks, fonts, your own domain, an embeddable checkout widget, or go headless with the API.</p>
            </div>
            <div className="card" id="payments">
              <div className="kpi">4+ gateways</div>
              <h3>Every way to pay</h3>
              <p>Cards, e-wallets, QR and PayPal, routed to the cheapest healthy gateway, with automatic failover. Or connect your own merchant account.</p>
            </div>
            <div className="card" id="payouts">
              <div className="kpi">T+1</div>
              <h3>Fast clearing</h3>
              <p>Rolling daily payouts with a small risk-based reserve, and instant payouts for trusted organizers, instead of holding your revenue until after the event.</p>
            </div>
          </div>
        </section>

        <section className="wrap">
          <h2>Local methods first, wherever your buyers are</h2>
          <p className="muted">Checkout shows each buyer the methods common in their country first.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Market</th><th>Methods</th><th>Gateways</th></tr>
              </thead>
              <tbody>
                {GATEWAYS.map((g) => (
                  <tr key={g.region}>
                    <td className="us">{g.region}</td>
                    <td><div className="chips">{g.methods.map((m) => <span key={m} className="chip">{m}</span>)}</div></td>
                    <td className="muted">{g.via}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="wrap" id="compare">
          <h2>How we compare</h2>
          <p className="muted small">
            Competitor details are from their public help pages as of Nov 2026 and may change. Check them for current terms.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th></th><th>Eventbrite</th><th>HelixPay</th><th>Stagepass</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Payment rails</td>
                  <td>Own processing; PayPal where unavailable, with Eventbrite fees invoiced monthly</td>
                  <td>PH local methods via PayMongo</td>
                  <td className="us good">Multi-gateway routing + bring your own account</td>
                </tr>
                <tr>
                  <td>Storefront</td>
                  <td>Fixed event-page template</td>
                  <td>Branded pages</td>
                  <td className="us good">Theme engine, custom domain, embed, headless API</td>
                </tr>
                <tr>
                  <td>Payout timing</td>
                  <td className="warn">Default: sent 3 business days after the event ends</td>
                  <td>Not publicly documented</td>
                  <td className="us good">T+1 after each sale (risk-based reserve); instant for trusted organizers</td>
                </tr>
                <tr>
                  <td>On-sale protection</td>
                  <td>Standard</td>
                  <td>Anti-scalping, QR scanning</td>
                  <td className="us good">Virtual waiting room, rotating QR, capped resale</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="wrap" id="architecture">
          <h2>How it&apos;s built</h2>
          <p className="muted">
            A modular monolith on Vercel with a payment-orchestration layer, a double-entry ledger and a risk-based payout
            engine. The full design is in <code>docs/ARCHITECTURE.md</code>.
          </p>
          <pre className="diagram">{DIAGRAM}</pre>
        </section>
      </main>
      <footer>
        <div className="wrap">
          Stagepass is a prototype. Payments run in sandbox mode and no real charges are made.
        </div>
      </footer>
    </>
  );
}
