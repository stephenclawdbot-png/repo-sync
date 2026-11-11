import { NextResponse } from "next/server";
import { DEMO_EVENT, platformFee } from "@/lib/demo";
import { routePayment, type OrganizerGatewayConfig } from "@/lib/payments/router";
import type { GatewayId, PaymentMethod } from "@/lib/payments/types";
import { POLICIES, splitSale, type RiskTier } from "@/lib/payouts";

const ORGANIZER_CONFIG: OrganizerGatewayConfig = {
  enabled: ["paymongo", "xendit", "stripe", "paypal"],
};

interface Body {
  tierId: string;
  qty: number;
  method: PaymentMethod;
  byoGateway?: GatewayId | null;
  degraded?: GatewayId[];
  riskTier?: RiskTier;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tier = DEMO_EVENT.tiers.find((t) => t.id === body.tierId);
  const qty = Math.trunc(Number(body.qty));
  if (!tier || !Number.isFinite(qty) || qty < 1 || qty > 10) {
    return NextResponse.json({ error: "Invalid tier or quantity" }, { status: 400 });
  }

  const subtotal = tier.priceMinor * qty;
  const fee = platformFee(subtotal, qty);
  const amount = { amount: subtotal + fee, currency: DEMO_EVENT.currency };

  const config: OrganizerGatewayConfig = {
    ...ORGANIZER_CONFIG,
    connectedAccounts: body.byoGateway ? { [body.byoGateway]: `acct_demo_${body.byoGateway}` } : undefined,
  };
  const health = Object.fromEntries((body.degraded ?? []).map((g) => [g, { successRate: 0.4 }]));

  let decision;
  try {
    decision = routePayment(body.method, amount, DEMO_EVENT.country, config, health);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }

  const orderId = `ord_${Date.now().toString(36)}`;
  const intent = await decision.gateway.createIntent({
    orderId,
    idempotencyKey: crypto.randomUUID(),
    amount,
    method: body.method,
    country: DEMO_EVENT.country,
    connectedAccount: decision.connectedAccount,
    platformFee: { amount: fee, currency: amount.currency },
    returnUrl: `/e/${DEMO_EVENT.slug}?order=${orderId}`,
  });

  // Organizer receives the ticket subtotal (buyer paid the platform fee); gateway cost is absorbed by the platform fee.
  const policy = POLICIES[body.riskTier ?? "established"];
  const payout = splitSale(subtotal, policy, new Date(), new Date(DEMO_EVENT.endsAt));

  return NextResponse.json({
    orderId,
    totals: { subtotal, platformFee: fee, total: amount.amount, currency: amount.currency },
    routing: {
      gateway: decision.gateway.displayName,
      reason: decision.reason,
      estimatedGatewayFee: decision.estimatedFee,
      candidates: decision.candidates,
    },
    intent: { providerRef: intent.providerRef, nextAction: intent.nextAction.type },
    payout: { policy: policy.label, ...payout },
    sandbox: true,
  });
}
