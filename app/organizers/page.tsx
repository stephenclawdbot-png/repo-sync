import type { Metadata } from "next";
import Link from "next/link";
import { PayoutSimulator } from "@/components/PayoutSimulator";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "For organizers" };

const METHODS = [
  { market: "Philippines", methods: "GCash, Maya, QR Ph, GrabPay, cards, PayPal", via: "PayMongo, Xendit" },
  { market: "Indonesia", methods: "QRIS, cards, PayPal", via: "Xendit" },
  { market: "Malaysia", methods: "DuitNow, GrabPay, cards", via: "Xendit, Stripe" },
  { market: "Thailand", methods: "PromptPay, cards", via: "Xendit, Stripe" },
  { market: "Singapore", methods: "PayNow, Apple Pay, cards", via: "Stripe" },
  { market: "Everywhere else", methods: "Cards, Apple Pay, Google Pay, PayPal", via: "Stripe, PayPal" },
];

export default function Organizers() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="wrap section stack" style={{ "--gap": "18px" } as React.CSSProperties}>
          <p className="mono">For organizers</p>
          <h1 className="h-app">Fill the room. Know who came. Get paid sooner.</h1>
          <p className="lede">Free RSVPs cost nothing. Paid tickets take local payment methods and pay out as you sell. Rewards turn your regulars into your marketing.</p>
          <div className="row">
            <Link className="btn btn--primary" href="/signup">Sign up as a merchant</Link>
            <Link className="btn" href="/signup">Open the merchant demo</Link>
            <Link className="btn" href="/s/bayfront">See a storefront</Link>
            <Link className="btn" href="/scan">Open the door scanner</Link>
          </div>
        </div>

        <div className="wrap stack" style={{ "--gap": "44px" } as React.CSSProperties}>
          <section className="grid-3" aria-label="What you get">
            <div className="card"><h2 className="h-sub">One guest list</h2><p className="muted">RSVPs, paid tickets and earned tickets land in the same list, with the same QR at the door.</p></div>
            <div className="card"><h2 className="h-sub">Your design everywhere</h2><p className="muted">Page, ticket, wallet pass and stub share one design that you control.</p></div>
            <div className="card"><h2 className="h-sub">Rewards with a budget</h2><p className="muted">Set what earns points and how many free tickets you’ll give. It stops when the budget is used.</p></div>
            <div className="card"><h2 className="h-sub">A scanner on any phone</h2><p className="muted">No hardware to rent. Staff open a link, enter the door code and scan.</p></div>
          </section>

          <section className="stack" aria-labelledby="o-pay">
            <h2 id="o-pay">Paid when you sell, not weeks later</h2>
            <p className="lede">Most platforms hold your ticket money until after the event. Rolling payouts send most of each sale on, and keep a small reserve to cover refunds.</p>
            <PayoutSimulator />
          </section>

          <section className="stack" aria-labelledby="o-meth">
            <h2 id="o-meth">The way your guests already pay</h2>
            <p className="lede">Checkout shows each guest the methods common in their country first, and routes the payment to the cheapest gateway that is working. You can also connect your own gateway account.</p>
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Payment methods by market">
              <table>
                <thead><tr><th scope="col">Market</th><th scope="col">Methods</th><th scope="col">Gateways</th></tr></thead>
                <tbody>{METHODS.map((m) => <tr key={m.market}><td><strong>{m.market}</strong></td><td>{m.methods}</td><td className="muted">{m.via}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="hint">Payments in this prototype run in sandbox mode. Gateway accounts are needed before real money moves.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
