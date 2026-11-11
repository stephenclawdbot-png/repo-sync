# Stagepass

RSVP platform for any gathering: guests **RSVP, buy, or earn** their way in; every entry is a QR ticket
that becomes a collectible **stub**; organizers customize the page, form, ticket and stub.

- `docs/PRODUCT.md`: product study and feature map (start here)
- `docs/ARCHITECTURE.md`: competitive study, system design, data model, scaling, compliance, roadmap
- `docs/BUSINESS.md`: positioning, revenue model, website structure, go-to-market, KPIs
- `lib/payments/`: gateway adapter interface + router (cheapest healthy gateway, BYO account priority, failover)
- `lib/payouts.ts`: risk-tiered rolling payout + reserve policy
- `app/`: marketing site (`/`), live storefront builder + checkout demo (`/e/manila-sound-fest`),
  payout simulator (`/dashboard`), `POST /api/checkout`, `/api/webhooks/[provider]`

The current prototype covers the paid-ticket path only (RSVP, earn, QR tickets, Wallet passes and stubs
are designed in the docs but not built yet). Payments run in **sandbox mode**: adapters model coverage and fees but make no real API calls.

```bash
npm install && npm run dev
```
