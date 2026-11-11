import { findEvent } from "@/lib/merchants";
import { NextResponse } from "next/server";
import { counts, existingTicket, issueTicket, recordReferral } from "@/lib/core";
import { platformFee } from "@/lib/events";
import { clampInt, fail, readJson } from "@/lib/http";
import { saveOrder } from "@/lib/orders";
import { createCheckoutSession, PAYMONGO_METHODS, paymongoLive } from "@/lib/payments/paymongo";
import { routePayment } from "@/lib/payments/router";
import type { PaymentMethod } from "@/lib/payments/types";
import { fields, store } from "@/lib/store";
import { cleanName, isId, newId } from "@/lib/token";

interface Body {
  slug: string;
  gid: string;
  name: string;
  tierId: string;
  qty: number;
  method: PaymentMethod;
  ref?: string;
}

/**
 * Checkout. With a PayMongo key set, this starts a real hosted payment. Without one it runs in sandbox:
 * the payment is treated as paid and the ticket is issued at once, with no charge.
 */
export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  const ev = body && (await findEvent(body.slug));
  const tier = ev?.tiers.find((t) => t.id === body?.tierId);
  if (!body || !ev || !tier) return fail("That ticket type is not on sale.", 404);
  if (ev.past) return fail("This event has ended.", 410);
  if (!isId(body.gid)) return fail("Missing guest id.");
  const name = cleanName(body.name);
  if (!name) return fail("Please enter the name for the ticket.");
  const qty = clampInt(body.qty, 1, 6);

  const c = await counts(ev);
  if (qty > c.spotsLeft) {
    const mine = `wait/${ev.slug}/${body.gid}~`;
    if (!(await store.list(mine)).length) await store.put(`${mine}${Date.now()}`);
    const queue = (await store.list(`wait/${ev.slug}/`)).sort((a, b) => Number(fields(a)[1]) - Number(fields(b)[1]));
    return NextResponse.json({
      status: "waitlisted",
      position: queue.findIndex((k) => k.startsWith(mine)) + 1,
      spotsLeft: c.spotsLeft,
    });
  }

  const subtotal = tier.priceMinor * qty;
  const fee = platformFee(subtotal, qty);
  const amount = { amount: subtotal + fee, currency: ev.currency };

  let decision;
  try {
    decision = routePayment(body.method, amount, ev.country, { enabled: ["paymongo", "xendit", "stripe", "paypal"] });
  } catch {
    return fail("That payment method is not available for this event.", 422);
  }
  const orderId = `ord_${newId(10)}`;
  const ref = isId(body.ref) ? body.ref : undefined;

  // Real payments: PayMongo is connected. Send the buyer to its hosted checkout; the ticket is issued
  // only after PayMongo confirms the payment (on return, and by webhook).
  if (paymongoLive()) {
    if (!PAYMONGO_METHODS[body.method]) return fail("That payment method is not available yet. Choose another.", 422);
    const origin = new URL(req.url).origin;
    try {
      await saveOrder({ id: orderId, slug: ev.slug, gid: body.gid, name, tierId: tier.id, qty, ref, totalMinor: amount.amount, createdAt: Date.now() });
      const session = await createCheckoutSession({
        orderId,
        description: `${ev.title}: ${qty} × ${tier.name}`,
        lines: [
          { name: `${ev.title} · ${tier.name}`, amount: tier.priceMinor, quantity: qty },
          { name: "Service fee", amount: fee, quantity: 1 },
        ],
        method: body.method,
        successUrl: `${origin}/api/checkout/return?order=${orderId}`,
        cancelUrl: `${origin}/e/${ev.slug}?pay=cancelled`,
      });
      await saveOrder({ id: orderId, slug: ev.slug, gid: body.gid, name, tierId: tier.id, qty, ref, totalMinor: amount.amount, sessionId: session.id, createdAt: Date.now() });
      return NextResponse.json({ status: "redirect", url: session.url, orderId, gateway: "PayMongo" });
    } catch (e) {
      console.error("paymongo checkout failed", e);
      return fail("We couldn’t start the payment. Please try again in a moment.", 502);
    }
  }

  // Sandbox: no gateway key is set, so nothing is charged and the ticket is issued straight away.
  await decision.gateway.createIntent({
    orderId,
    idempotencyKey: newId(16),
    amount,
    method: body.method,
    country: ev.country,
    platformFee: { amount: fee, currency: ev.currency },
    returnUrl: `/e/${ev.slug}`,
  });

  const held = await existingTicket(ev, body.gid);
  const admits = held?.via === "buy" && held.tier === tier.id ? held.admits + qty : qty;
  const token = await issueTicket(ev, { gid: body.gid, name, via: "buy", tier: tier.id, admits, replace: true });
  await store.remove(`wait/${ev.slug}/${body.gid}~`);
  await recordReferral(ev, body.gid, ref);

  return NextResponse.json({
    status: "paid",
    token,
    admits,
    orderId,
    totals: { subtotal, fee, total: amount.amount, currency: ev.currency },
    gateway: decision.gateway.displayName,
    sandbox: true,
  });
}
