# Stagepass — Business & Website Design

## 1. Positioning

**"RSVP, buy or earn your way in — and keep the stub."**

An RSVP platform for any gathering (see `PRODUCT.md`). Free RSVPs are the growth engine; paid tickets,
Pro plans and earn/sponsor features are the revenue. The payment and payout advantages below are the pitch
for the paid-ticket path: *"Your brand. Every payment method. Your money tomorrow."*

Target customers, in order:
1. **Mid-size organizers in Southeast Asia** (concerts, festivals, conferences, fun runs, workshops) that
   lose sales because buyers can't pay with their local wallet, and that wait weeks for their money.
2. **Promoters running big on-sales** (K-pop, international tours) who need anti-scalping and a waiting room.
3. **Creators / venues** who want ticket + merch + membership in one branded store.

## 2. Revenue model

| Stream | Pricing (starting point to test) |
|---|---|
| Free RSVP events | Free (acquisition). Optional paid SMS/chat credits |
| Ticket fee | 3.5 % + ₱15 / $0.50 per paid ticket (buyer-pays or organizer-absorbs, organizer's choice). Free events free. |
| Payment processing | Pass-through gateway cost + small margin when platform-collected; **0 margin when organizer brings their own gateway** |
| Instant payouts | 1 % of payout amount (covers working capital) |
| Pro plan | Monthly subscription: custom domain, remove branding, advanced themes, API, priority support |
| Enterprise | Waiting room, dedicated seat-map design, on-site scanning hardware and staff |
| Earn / sponsors | Sponsor-funded quests (rev-share), ambassador tools in Pro |
| Add-ons | Ticket protection / refund insurance (rev-share), SMS credits, resale fee (buyer side) |

Unit-economics notes: gateway fees in SEA vary (~2–3.5 % card, ~1.5–2.5 % e-wallet, flat fee for QR/bank),
so routing to cheaper local methods is both a buyer convenience **and** a margin lever.

## 3. Website structure (public marketing site)

| Page | Purpose / key content |
|---|---|
| **Home** | Hero with the three promises (payment choice, branded storefront, fast payouts); live storefront demo; logos; payout comparison table; CTA "Create your event — free" |
| **Features** | Storefront builder · Payments · Payouts · Seating · Check-in · Anti-scalping · Merch |
| **Payments** | Gateway logos by country; "bring your own account"; payout speed table |
| **Pricing** | Fee calculator (ticket price → buyer pays / you receive); plan comparison |
| **Compare** | vs Eventbrite, vs HelixPay, vs others: honest comparison table |
| **Customers / case studies** | Sales numbers, payout speed, conversion lift by payment method |
| **Developers** | API docs, embed widget, webhooks |
| **Security & trust** | PCI, KYC, how reserves protect buyers, refund policy |
| **Blog / guides** | SEO: "how to sell tickets online in the Philippines", "GCash ticketing", etc. |

### App surfaces
- **Organizer dashboard**: events, storefront editor (live preview), orders, payouts & reserve, team, settings → gateways.
- **Buyer storefront** (per event / per organizer), checkout, "My tickets" wallet.
- **Scanner** PWA / mobile app.
- **Admin / ops**: KYC review, risk queue, reconciliation, payouts control.

## 4. Go-to-market

1. **Beachhead: Philippines**. Local wallets (GCash/Maya/QRPh) matter here, and HelixPay proves demand.
   Win with brand control + faster payouts + multi-gateway.
2. Free migration: import events and attendee lists from Eventbrite CSV.
3. Promoter partnerships: lower fee for the first 3 events in exchange for a case study.
4. Expand to MY/ID/TH/VN using Xendit/Adyen coverage; then any market Stripe Connect covers.
5. Content/SEO + organizer communities (run clubs, conference organizers, indie music).

## 5. Operating requirements
- Entity + bank accounts in each launch country; partner gateways' marketplace programmes for licensing coverage.
- Terms of service: refund policy, reserve terms, prohibited events.
- Risk & support ops team (start: 1 person, on-call during big on-sales).
- Insurance partner for event cancellation, which unlocks lower reserves and instant payouts.

## 6. KPIs
GMV, take rate, checkout conversion (by payment method), payout time (median hours sale→bank),
chargeback rate, organizer retention (repeat events), storefront customisation adoption.
