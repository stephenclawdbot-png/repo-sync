# Stagepass — Architecture & System Design

> Working name. A ticketing + commerce platform for event organizers that fixes the
> three main complaints about incumbent platforms: **one payment rail**, **rigid storefronts**,
> and **slow payouts**.

---

## 1. Competitive study

| | **Eventbrite** | **HelixPay** | **Stagepass (target)** |
|---|---|---|---|
| Market | Global, self-serve | Philippines, high-demand concerts, sports, K-pop, subscriptions | SEA-first (PH, ID, MY, SG, TH, VN), global-ready |
| Payment rails | Eventbrite Payment Processing; **PayPal** only where EPP isn't available (organizer then gets **invoiced monthly** for Eventbrite's fees) | Local methods (cards, GCash, Maya, online banking) via PayMongo | **Multi-gateway**: Stripe, PayMongo, Xendit, PayPal, Adyen, local e-wallets / QR (QRPh, PromptPay, DuitNow, PayNow), BNPL; organizer can **bring their own** merchant account |
| Storefront | Fixed event-page template with a logo, banner and colour | Branded checkout pages, mostly fixed layout | **Theme engine + custom domain + embeddable widget + headless API** |
| Payouts | Default: **sent 3 business days after event ends**; US bank receipt ~6–8 business days after event; extra 5–7 days for non-US banks; faster schedules only once you're "eligible" | Not publicly documented | **Rolling payouts** (T+1 default, instant for trusted organizers) with a risk-based reserve instead of holding 100 % until after the event |
| Seating / ops | GA + reserved seating, check-in app | QR tickets, scanning, seat assignment, anti-scalping | GA + reserved + timed entry, offline-capable scanner, anti-scalping (ID-bound / rotating QR), controlled resale |
| Merch / add-ons | Limited add-ons | Subscriptions & merch storefronts | Tickets + merch + bundles + memberships in **one cart** |

### Gaps to exploit
1. **Payment choice** — let organizers pick (or combine) gateways per region; show buyers their local wallet first. Higher conversion, lower fees.
2. **Cash-flow** — incumbents keep organizer money until after the event to cover refund/chargeback risk. Replace "hold everything" with a **scored rolling reserve**.
3. **Brand control** — organizers want their own domain, layout, and fonts, and want to embed checkout on their own site.

---

## 2. Requirements

### Functional
- Organizer onboarding with KYC/KYB, bank account verification.
- Event + ticket-tier creation (GA, reserved seat maps, timed slots, promo codes, access codes, waitlists).
- Storefront builder (themes, blocks, custom domain, embed widget).
- Checkout with multi-gateway routing, holds and seat locks, anti-bot queue for on-sales.
- Ticket issuance (QR / wallet passes), transfers, controlled resale.
- Check-in scanner app (offline-capable).
- Ledger, fees, taxes, refunds, chargebacks.
- Payout engine with configurable schedules and reserves.
- Reporting, exports, webhooks, public API.

### Non-functional
| Concern | Target |
|---|---|
| On-sale spike | 50k checkout attempts/min for one event, with no overselling |
| Availability | 99.95 % checkout; scanner works offline |
| Consistency | Inventory and ledger strongly consistent; everything else eventually consistent |
| Latency | Storefront p95 < 200 ms (edge cached); checkout API p95 < 400 ms excluding gateway |
| Compliance | PCI DSS SAQ-A (we never touch raw PAN — tokenised gateway fields), PDPA/GDPR, BSP/MAS e-money rules, AML/KYC |

---

## 3. High-level architecture

```
                      ┌──────────────────────────────┐
  Buyers ───────────▶ │  Edge (Vercel / CDN)          │
  Organizers          │  - Storefront SSR/ISR         │
  Embeds (iframe/JS)  │  - Custom domains, WAF, bot   │
                      │  - Virtual waiting room       │
                      └──────────────┬───────────────┘
                                     │
                      ┌──────────────▼───────────────┐
                      │  API Gateway / BFF            │  auth, rate limits, idempotency keys
                      └──────────────┬───────────────┘
        ┌──────────────┬─────────────┼──────────────┬──────────────┬──────────────┐
        ▼              ▼             ▼              ▼              ▼              ▼
  ┌──────────┐  ┌────────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
  │ Catalog  │  │ Inventory  │ │ Orders /  │ │ Payments   │ │ Ledger     │ │ Payouts    │
  │ (events, │  │ & Seating  │ │ Checkout  │ │ Orchestr.  │ │ (double-   │ │ & Risk     │
  │ tiers,   │  │ (holds,    │ │ (cart,    │ │ (gateway   │ │  entry)    │ │ (reserve,  │
  │ themes)  │  │ seat locks)│ │ saga)     │ │  adapters) │ │            │ │  schedule) │
  └────┬─────┘  └─────┬──────┘ └─────┬─────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
       │              │              │             │              │              │
       └──────────────┴───────┬──────┴─────────────┴──────────────┴──────────────┘
                              ▼
                 ┌───────────────────────────┐        ┌──────────────────────────┐
                 │ Event bus (Kafka / SQS /   │──────▶ │ Ticketing, Notifications, │
                 │ Inngest) + outbox pattern │        │ Search, Analytics, Webhooks│
                 └───────────────────────────┘        └──────────────────────────┘

  Data: Postgres (Neon/Aurora) per bounded context · Redis (holds, queue, rate limits)
        · Object storage (assets, seat maps) · Warehouse (BigQuery/ClickHouse)

  External: Stripe · PayMongo · Xendit · PayPal · Adyen · banks (InstaPay/PESONet, FAST,
            DuitNow, PromptPay) · KYC (Sumsub/Persona) · Email/SMS/WhatsApp
```

Start as a **modular monolith** (one Next.js app + one worker service, separate schemas per module).
Split out **Inventory** and **Payments** first when scale demands — they have the hardest load and
compliance profiles.

---

## 4. Core components

### 4.1 Storefront & theme engine (customisation)
- A storefront is **JSON config + blocks**, not hand-written HTML:
  `theme { colors, fonts, radius, layout }` + `blocks[] { hero, lineup, schedule, tiers, faq, merch, map, custom_html }`.
- Rendered with Next.js **ISR** at the edge; config changes trigger on-demand revalidation by tag.
- **Custom domains** via the Vercel Domains API (auto TLS). Domain → organizer resolved in middleware.
- **Embeds:** `<script src="https://cdn.stagepass.app/embed.js" data-event="...">` opens checkout in an
  iframe modal (keeps PCI scope off the organizer's site).
- **Headless API** for organizers who want a fully custom frontend.
- Sanitize `custom_html` blocks (no scripts) and sandbox them in their own iframe.

### 4.2 Inventory & seating (no overselling)
- Each sellable unit (GA tier counter or individual seat) has authoritative state in Postgres.
- **Holds**: when a buyer starts checkout, place a TTL hold (10 min) in Redis *and* an
  `inventory_holds` row. A seat is sold when `status` moves from `held` to `sold` inside one transaction.
- GA counters: `UPDATE tiers SET sold = sold + :n WHERE id = :id AND sold + held + :n <= capacity`
  (single-row atomic check). For mega on-sales, **shard the counter** into N buckets to avoid row-lock hot spots.
- **Virtual waiting room** at the edge for flagged on-sales: buyers get a signed, time-boxed admission
  token; only admitted tokens can create holds. Combine with bot scoring (Turnstile / device fingerprint).

### 4.3 Checkout saga
```
create_order(PENDING)
  → reserve_inventory (hold)
  → create_payment_intent (Payment Orchestrator picks gateway)
  → buyer authenticates (3DS / wallet redirect / QR)
  → webhook: payment.succeeded  → order PAID → convert hold to SOLD → issue tickets → ledger entries
  → webhook: payment.failed / hold expired → release inventory → order CANCELLED
```
- Every step is **idempotent** (idempotency key = order id + step).
- State changes are written with a **transactional outbox**, so events are never lost.
- Late-success webhook after the hold expired → auto-refund if inventory is gone, else re-allocate.

### 4.4 Payment orchestration (multi-gateway)
A gateway-agnostic interface (see `lib/payments/` in this repo):

```ts
interface PaymentGateway {
  id: 'stripe' | 'paymongo' | 'xendit' | 'paypal' | 'adyen'
  supports(method: PaymentMethod, currency: string, country: string): boolean
  createIntent(input): Promise<Intent>          // returns client secret / redirect / QR
  capture(intentId): Promise<void>
  refund(chargeId, amount): Promise<Refund>
  parseWebhook(rawBody, headers): NormalizedEvent // verifies signature
}
```

**Routing rules** (per organizer, overridable):
1. Organizer's **connected account** for that gateway (BYO merchant — money settles directly to them, fastest payout).
2. Cheapest gateway that supports the buyer's method + currency.
3. Health-based **failover**: if a gateway's success rate drops below a threshold (rolling 5 min), route around it.
4. Local-method-first ordering: GCash/Maya in PH, PromptPay in TH, DuitNow in MY, PayNow in SG, QRIS in ID.

Two settlement models:
- **Marketplace / platform-collected** (Stripe Connect, Xendit xenPlatform, PayMongo platforms): we collect,
  take fees via application fee, and run payouts. Gives us control over reserves.
- **Direct / BYO**: funds settle into the organizer's own gateway account; we bill platform fees by
  application fee where supported, otherwise via card on file (no PayPal-style monthly invoices).

### 4.5 Ledger (source of truth for money)
- **Double-entry**, append-only, integer minor units, currency per entry.
- Accounts per organizer: `organizer_pending`, `organizer_available`, `organizer_reserve`,
  `platform_fees`, `gateway_fees`, `tax_payable`, `refunds_payable`.
- Example ticket sale (₱1,000, 3.5 % + ₱15 platform fee, 2.5 % gateway fee):
  ```
  DR gateway_clearing      1000.00
     CR organizer_pending        935.00
     CR platform_fees             50.00
     CR gateway_fees              15.00   (actual from gateway settlement report)
  ```
- Daily **reconciliation** job matches gateway settlement files against ledger; mismatches → ops queue.

### 4.6 Payouts & risk (fast clearing)
Replace "hold until after the event" with a **risk-based rolling reserve**:

| Organizer tier | How earned | Payout schedule | Reserve |
|---|---|---|---|
| New | KYC passed | T+2 after **sale**, after the first 5 days of history | 30 % held until event + 7 days |
| Established | 3 events, chargeback rate < 0.5 % | T+1 daily | 10–15 % |
| Trusted | 12 months, low disputes, insured | **Instant** (InstaPay / FAST / RTP) on demand, small fee | 5 % or covered by event-cancellation insurance |

Risk score inputs: KYC strength, history, chargeback/refund rate, time-to-event, ticket price
outliers, velocity spikes, event category, venue verification. Score recalculated on each sale batch;
reserve % adjusts automatically.

Payout pipeline: `ledger.available → payout batch (cron hourly) → bank rail adapter → status webhooks →
ledger settled`. Failures retry with backoff, then ops queue.

**Funding instant payouts** before gateway settlement lands needs platform working capital — an
explicit balance-sheet cost to price into the instant-payout fee.

### 4.7 Ticketing & check-in
- Ticket = signed payload (`ticket_id, event_id, seat, nonce`) — Ed25519 signature.
- **Rotating QR** (TOTP-style, refreshes every 30 s in-app) against screenshot resale.
- Apple/Google Wallet passes.
- Scanner app downloads the event's ticket manifest + public key → validates **offline**, syncs scans
  when online, resolves duplicates by first-scan-wins with alerts.
- Controlled resale: price cap, original ticket invalidated + reissued to new holder.

### 4.8 Notifications, webhooks, analytics
- Email (Resend/SES), SMS/WhatsApp (local providers), push.
- Outbound organizer webhooks with signing secret, retries, and a replay UI.
- Event stream → warehouse for dashboards (sales velocity, conversion by payment method, payout forecast).

---

## 5. Data model (core tables)

```
organizers(id, name, country, kyc_status, risk_tier, default_currency)
organizer_gateways(id, organizer_id, provider, mode[platform|byo], account_ref, enabled)
storefronts(id, organizer_id, domain, theme_json, blocks_json, published_at)
events(id, organizer_id, storefront_id, title, starts_at, ends_at, venue_id, status)
ticket_tiers(id, event_id, name, price_minor, currency, capacity, sold, held, sales_start, sales_end)
seats(id, event_id, section, row, number, tier_id, status[open|held|sold|blocked], hold_id)
inventory_holds(id, order_id, expires_at, status)
orders(id, event_id, buyer_id, status, total_minor, currency, idempotency_key)
payments(id, order_id, provider, provider_ref, method, status, amount_minor, fee_minor)
tickets(id, order_id, tier_id, seat_id, holder_id, status, signature)
ledger_entries(id, txn_id, account, organizer_id, amount_minor, currency, direction, created_at)
payouts(id, organizer_id, amount_minor, currency, rail, status, scheduled_for, sent_at)
reserves(id, organizer_id, event_id, amount_minor, release_at, status)
outbox(id, aggregate, type, payload, published_at)
```

---

## 6. Tech stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Web / storefront / dashboard | **Next.js (App Router) on Vercel** | ISR + edge middleware for custom domains, fast global storefronts |
| API | Next.js route handlers → later a separate service (Node/TypeScript or Go) for Payments + Inventory | Start simple |
| DB | **Postgres** (Neon via Vercel Marketplace, or Aurora) | Transactions for inventory + ledger |
| Cache / holds / queue | **Redis** (Upstash) | TTL holds, rate limits, waiting room |
| Background jobs | Inngest / Vercel Queues / Temporal for sagas & payouts | Durable retries |
| Auth | Clerk / Auth.js; organizer SSO later | |
| Payments | Stripe Connect, PayMongo, Xendit, PayPal, Adyen (enterprise) | Multi-rail |
| KYC | Sumsub / Persona | |
| Observability | Vercel Observability + OpenTelemetry + Sentry | |
| Analytics | ClickHouse / BigQuery | |

---

## 7. Scaling the on-sale

1. Pre-warm: storefront fully static, inventory counts served from Redis snapshot (refreshed every 1 s).
2. Waiting room admits N buyers/sec (N = measured checkout throughput).
3. Holds in Redis with Lua scripts for atomic decrement; Postgres is updated asynchronously but
   the **sold** transition is always a DB transaction.
4. Payment intents created only after a successful hold.
5. Gateway failover keeps conversion up if one provider degrades.

---

## 8. Security & compliance
- PCI scope minimised: gateway-hosted fields / redirects only. SAQ-A.
- Webhook signature verification per provider; replay protection by event id.
- Secrets in Vercel env (encrypted) or a vault; per-organizer gateway keys encrypted with KMS.
- Least-privilege staff roles; all money movements require ledger entries + audit log.
- Licensing: platform-collected funds may need e-money / payment-facilitator licensing per country
  (e.g. BSP OPS registration in PH). **Start with gateway marketplaces (Stripe Connect / xenPlatform)
  that carry the licence**, then apply for your own.

---

## 9. Roadmap

| Phase | Scope |
|---|---|
| **MVP (0–3 mo)** | GA tickets, theme engine (3 themes), Stripe Connect + PayMongo/Xendit, T+2 payouts with reserve, QR tickets, scanner PWA |
| **v1 (3–6 mo)** | Reserved seating, custom domains, embed widget, PayPal + local QR rails, promo codes, organizer webhooks |
| **v2 (6–12 mo)** | Waiting room, instant payouts, rotating QR, resale, merch + memberships, BYO gateway, headless API |
| **Scale** | Split Inventory/Payments services, multi-region, own payment licence, insurance-backed payouts |
