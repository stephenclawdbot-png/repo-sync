/**
 * PayMongo, the default gateway: hosted Checkout Sessions (GCash, Maya, QR Ph, GrabPay, cards).
 *
 * Switches on when PAYMONGO_SECRET_KEY is set. A test key (sk_test_…) uses PayMongo's own test mode;
 * a live key (sk_live_…) takes real money. Without a key, checkout stays in the built-in sandbox.
 *
 *   PAYMONGO_SECRET_KEY       secret API key
 *   PAYMONGO_WEBHOOK_SECRET   signing secret of the webhook registered for
 *                             https://<your-domain>/api/webhooks/paymongo  (event: checkout_session.payment.paid)
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentMethod } from "./types";

const base = () => process.env.PAYMONGO_API_BASE ?? "https://api.paymongo.com/v1";

export const paymongoLive = () => Boolean(process.env.PAYMONGO_SECRET_KEY);
export const paymongoTestMode = () => (process.env.PAYMONGO_SECRET_KEY ?? "").startsWith("sk_test_");

/** Our method names → PayMongo's payment_method_types. Methods not listed cannot be taken through PayMongo. */
export const PAYMONGO_METHODS: Partial<Record<PaymentMethod, string>> = {
  gcash: "gcash",
  maya: "paymaya",
  qrph: "qrph",
  grabpay: "grab_pay",
  card: "card",
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64");
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { authorization: `Basic ${auth}`, "content-type": "application/json", accept: "application/json" },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { errors?: { detail?: string }[] } & T;
  if (!res.ok) throw new Error(body.errors?.[0]?.detail ?? `PayMongo answered ${res.status}`);
  return body;
}

export interface CheckoutLine {
  name: string;
  /** centavos, per unit */
  amount: number;
  quantity: number;
}

interface SessionResponse {
  data: {
    id: string;
    attributes: {
      checkout_url: string;
      reference_number?: string;
      payments?: { attributes?: { status?: string; amount?: number } }[];
      payment_intent?: { attributes?: { status?: string } };
    };
  };
}

export async function createCheckoutSession(input: {
  orderId: string;
  description: string;
  lines: CheckoutLine[];
  method: PaymentMethod;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string }> {
  const type = PAYMONGO_METHODS[input.method];
  if (!type) throw new Error("That payment method is not available.");
  const res = await call<SessionResponse>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: input.lines.map((l) => ({ currency: "PHP", amount: l.amount, name: l.name, quantity: l.quantity })),
          payment_method_types: [type],
          description: input.description,
          reference_number: input.orderId,
          metadata: { order: input.orderId },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          send_email_receipt: false,
          show_line_items: true,
        },
      },
    }),
  });
  return { id: res.data.id, url: res.data.attributes.checkout_url };
}

/** Ask PayMongo directly whether a session was paid. Never trust the browser's return alone. */
export async function sessionPaid(sessionId: string): Promise<boolean> {
  const res = await call<SessionResponse>(`/checkout_sessions/${encodeURIComponent(sessionId)}`);
  const a = res.data.attributes;
  return Boolean(a.payments?.some((p) => p.attributes?.status === "paid")) || a.payment_intent?.attributes?.status === "succeeded";
}

/**
 * Verify a webhook. Header: `Paymongo-Signature: t=<timestamp>,te=<test sig>,li=<live sig>`,
 * where the signature is HMAC-SHA256 of `<timestamp>.<raw body>` with the webhook's secret.
 */
export function verifyWebhook(rawBody: string, header: string | null): { type: string; orderId?: string; sessionId?: string } | null {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.trim().split("=") as [string, string]));
  const given = parts.li || parts.te;
  if (!parts.t || !given) return null;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return null; // stale: likely a replay
  try {
    const evt = JSON.parse(rawBody) as {
      data?: { attributes?: { type?: string; data?: { id?: string; attributes?: { reference_number?: string; metadata?: { order?: string } } } } };
    };
    const attrs = evt.data?.attributes;
    const session = attrs?.data;
    return {
      type: attrs?.type ?? "",
      sessionId: session?.id,
      orderId: session?.attributes?.metadata?.order ?? session?.attributes?.reference_number,
    };
  } catch {
    return null;
  }
}
