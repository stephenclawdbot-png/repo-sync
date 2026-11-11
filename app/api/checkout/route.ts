import { findEvent } from "@/lib/merchants";
import { NextResponse } from "next/server";
import { counts, existingTicket, issueTicket, recordReferral } from "@/lib/core";
import { platformFee } from "@/lib/events";
import { clampInt, fail, readJson } from "@/lib/http";
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
 * Sandbox checkout: routes the payment to a gateway, treats it as paid, and issues the ticket.
 * No real charge is made. In production the ticket is issued from the gateway's webhook instead.
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
  await recordReferral(ev, body.gid, isId(body.ref) ? body.ref : undefined);

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
