# Stagepass

An RSVP platform for any gathering. Guests **RSVP, buy, or earn** their way in; every entry is a signed QR
ticket that becomes a collectible **stub** at the door; merchants design their own storefront, tickets and stubs.

Live prototype: https://stagepass-sigma.vercel.app

## Try it

| Where | What |
|---|---|
| `/` | Landing page and ten sample events |
| `/signup` | Sign up as a guest or a merchant, or load a ready-made demo account for either |
| `/me` | Guest account: profile, upcoming tickets, stub collection, points |
| `/dashboard` | Merchant back office: create events, watch the guest list, design the storefront |
| `/s/bayfront` | A sample merchant storefront (yours is at `/s/<your-address>`) |
| `/e/<event>` | Event page with the RSVP / Buy / Earn panel |
| `/t/<token>` | A ticket: QR, wallet buttons, calendar; turns into a stub when scanned |
| `/scan` | Door scanner (camera or pasted code). Sample events use door code `2468` |
| `/host/<event>` | Live guest stats for one event |
| `/studio` | Design playground |

A full loop: RSVP to an event → open the ticket → open `/scan` on another device or tab, enter the door code,
scan or paste the ticket link → the ticket page flips to a stub by itself.

## What is real and what is demo

- **Real:** RSVP with capacity, plus-ones, questions and waitlist; signed tickets; door check-in with
  duplicate detection; stubs; points, referrals and reward redemption with budgets; merchant sign-up, event
  creation and storefront editing; Apple/Google Wallet pass generation (see below).
- **Payments:** PayMongo is the default gateway (GCash, Maya, QR Ph, GrabPay, cards). Until a PayMongo key
  is set, checkout runs in sandbox: it issues the ticket at once and charges nothing.
- **Demo-grade:** accounts. There is no password or email/phone verification; a guest or merchant session
  lives in the browser. Storage is a small record store on Vercel Blob, not the Postgres design in the docs.

## Wallet passes

Buttons appear on every ticket and switch on when credentials are set as environment variables:

- Apple: `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT`, `APPLE_PASS_KEY`, `APPLE_WWDR_CERT`
  (optional `APPLE_PASS_KEY_PASSPHRASE`). Needs an Apple Developer account.
- Google: `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SA_EMAIL`, `GOOGLE_WALLET_SA_KEY`. Needs a Google Wallet
  issuer account.

## Payments (PayMongo)

Set these to switch from sandbox to PayMongo's hosted checkout:

- `PAYMONGO_SECRET_KEY`: a test key (`sk_test_…`) uses PayMongo's test mode; a live key takes real money.
- `PAYMONGO_WEBHOOK_SECRET`: the signing secret of a webhook registered in PayMongo for
  `https://<your-domain>/api/webhooks/paymongo`, event `checkout_session.payment.paid`.

The buyer pays on PayMongo's page and returns; the ticket is issued only after PayMongo confirms payment
(checked on return, and again by webhook in case the tab was closed). This was built to PayMongo's published
API and tested against a stand-in server, not yet against PayMongo itself. Run a test-key payment before going live.
Known gap: seats are not held while a buyer is on the payment page.

Other settings: `TICKET_SECRET` (signs tickets and merchant sessions), `BLOB_READ_WRITE_TOKEN` (storage; without
it the app keeps data in memory).

## Docs

- `docs/PRODUCT.md`: product study and feature map
- `docs/DESIGN.md`: design study and design system
- `docs/ARCHITECTURE.md`: production system design
- `docs/BUSINESS.md`: business model and go-to-market

## Run locally

```bash
npm install
```

```bash
npm run dev
```
