import { NextResponse } from "next/server";
import { ALL_GATEWAYS } from "@/lib/payments/gateways";

/**
 * Unified webhook entry point: /api/webhooks/stripe, /api/webhooks/paymongo, ...
 *
 * Production flow:
 *  1. adapter.parseWebhook() verifies the provider signature and normalises the event.
 *  2. Dedupe on event id (processed_webhooks table) for replay protection.
 *  3. Write order/ledger changes + an outbox row in ONE transaction.
 *  4. Return 200 fast; ticket issuance, emails, payouts run from the outbox.
 */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const gateway = ALL_GATEWAYS.find((g) => g.id === provider);
  if (!gateway) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  if (process.env.WEBHOOKS_ENABLED !== "true") {
    return NextResponse.json({ error: "Webhooks disabled in sandbox" }, { status: 503 });
  }

  try {
    const event = await gateway.parseWebhook(await req.text(), req.headers);
    return NextResponse.json({ received: true, type: event.type });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
