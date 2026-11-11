/**
 * Gateway adapters.
 *
 * These are SANDBOX/DEMO adapters: they model each provider's coverage and fee
 * structure but do not call the real APIs. To go live, replace the body of
 * `createIntent`, `refund`, and `parseWebhook` with each provider's SDK calls
 * (Stripe Connect PaymentIntents, PayMongo Payment Intents, Xendit Payment
 * Requests / xenPlatform, PayPal Orders v2) and verify webhook signatures.
 *
 * Fee numbers are illustrative placeholders for routing logic, not quotes.
 */
import type {
  CreateIntentInput,
  FeeSchedule,
  GatewayId,
  Intent,
  Money,
  NormalizedEvent,
  PaymentGateway,
  PaymentMethod,
} from "./types";

interface Coverage {
  countries: string[];
  currencies: string[];
  methods: Partial<Record<PaymentMethod, FeeSchedule>>;
}

function makeGateway(
  id: GatewayId,
  displayName: string,
  coverage: Coverage,
  actionFor: (method: PaymentMethod, ref: string, input: CreateIntentInput) => Intent["nextAction"],
): PaymentGateway {
  return {
    id,
    displayName,
    supports(method, currency, country) {
      return (
        method in coverage.methods &&
        coverage.currencies.includes(currency) &&
        (coverage.countries.includes("*") || coverage.countries.includes(country))
      );
    },
    fee(method, amount) {
      const f = coverage.methods[method];
      if (!f) return Number.POSITIVE_INFINITY;
      return Math.round((amount.amount * f.percentBps) / 10_000) + f.fixedMinor;
    },
    async createIntent(input) {
      const ref = `${id}_${input.orderId}_${input.idempotencyKey.slice(0, 8)}`;
      return {
        gateway: id,
        providerRef: ref,
        status: "requires_action",
        nextAction: actionFor(input.method, ref, input),
        estimatedFee: this.fee(input.method, input.amount),
      };
    },
    async refund(providerRef: string, _amount: Money) {
      return { id: `re_${providerRef}`, status: "pending" };
    },
    async parseWebhook(rawBody: string): Promise<NormalizedEvent> {
      // Production: verify the provider signature header before trusting the body.
      return JSON.parse(rawBody) as NormalizedEvent;
    },
  };
}

const redirect = (base: string) => (_m: PaymentMethod, ref: string, input: CreateIntentInput) =>
  ({ type: "redirect", url: `${base}?ref=${ref}&return=${encodeURIComponent(input.returnUrl)}` }) as const;

export const stripe = makeGateway(
  "stripe",
  "Stripe",
  {
    countries: ["*"],
    currencies: ["USD", "SGD", "MYR", "THB", "PHP", "EUR", "GBP", "AUD"],
    methods: {
      card: { percentBps: 340, fixedMinor: 50 },
      apple_pay: { percentBps: 340, fixedMinor: 50 },
      google_pay: { percentBps: 340, fixedMinor: 50 },
      grabpay: { percentBps: 330, fixedMinor: 0 },
      paynow: { percentBps: 130, fixedMinor: 0 },
      promptpay: { percentBps: 165, fixedMinor: 0 },
    },
  },
  (m, ref) =>
    m === "paynow" || m === "promptpay"
      ? { type: "qr", payload: `00020101${ref}` }
      : { type: "client_secret", value: `pi_${ref}_secret_demo` },
);

export const paymongo = makeGateway(
  "paymongo",
  "PayMongo",
  {
    countries: ["PH"],
    currencies: ["PHP"],
    methods: {
      card: { percentBps: 350, fixedMinor: 1500 },
      gcash: { percentBps: 250, fixedMinor: 0 },
      maya: { percentBps: 220, fixedMinor: 0 },
      grabpay: { percentBps: 220, fixedMinor: 0 },
      qrph: { percentBps: 150, fixedMinor: 0 },
    },
  },
  (m, ref, input) =>
    m === "qrph" ? { type: "qr", payload: `00020101QRPH${ref}` } : redirect("https://pm.demo/authorize")(m, ref, input),
);

export const xendit = makeGateway(
  "xendit",
  "Xendit",
  {
    countries: ["PH", "ID", "MY", "TH", "VN"],
    currencies: ["PHP", "IDR", "MYR", "THB", "VND"],
    methods: {
      card: { percentBps: 320, fixedMinor: 1000 },
      gcash: { percentBps: 230, fixedMinor: 0 },
      maya: { percentBps: 200, fixedMinor: 0 },
      qrph: { percentBps: 140, fixedMinor: 0 },
      qris: { percentBps: 70, fixedMinor: 0 },
      duitnow: { percentBps: 120, fixedMinor: 0 },
      promptpay: { percentBps: 150, fixedMinor: 0 },
    },
  },
  (m, ref, input) =>
    m === "qrph" || m === "qris" || m === "duitnow" || m === "promptpay"
      ? { type: "qr", payload: `00020101XND${ref}` }
      : redirect("https://xnd.demo/checkout")(m, ref, input),
);

export const paypal = makeGateway(
  "paypal",
  "PayPal",
  {
    countries: ["*"],
    currencies: ["USD", "PHP", "SGD", "MYR", "THB", "EUR", "GBP", "AUD"],
    methods: {
      paypal: { percentBps: 440, fixedMinor: 1500 },
      card: { percentBps: 440, fixedMinor: 1500 },
    },
  },
  redirect("https://paypal.demo/checkoutnow"),
);

export const ALL_GATEWAYS: PaymentGateway[] = [stripe, paymongo, xendit, paypal];
