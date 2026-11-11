# Stagepass

Ticketing + commerce platform prototype: **branded storefronts, multi-gateway checkout, fast rolling payouts**.
Built in response to two gaps in incumbent platforms: Eventbrite's limited storefront, PayPal-only fallback
and post-event payouts, and the PH-only reach of HelixPay.

- `docs/ARCHITECTURE.md`: competitive study, system design, data model, scaling, compliance, roadmap
- `docs/BUSINESS.md`: positioning, revenue model, website structure, go-to-market, KPIs
- `lib/payments/`: gateway adapter interface + router (cheapest healthy gateway, BYO account priority, failover)
- `lib/payouts.ts`: risk-tiered rolling payout + reserve policy
- `app/`: marketing site (`/`), live storefront builder + checkout demo (`/e/manila-sound-fest`),
  payout simulator (`/dashboard`), `POST /api/checkout`, `/api/webhooks/[provider]`

Payments run in **sandbox mode**: adapters model coverage and fees but make no real API calls.

```bash
npm install && npm run dev
```
