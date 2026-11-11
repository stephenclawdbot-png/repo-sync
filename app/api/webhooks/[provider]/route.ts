import { NextResponse } from "next/server";
import { fulfilOrder, getOrder } from "@/lib/orders";
import { verifyWebhook } from "@/lib/payments/paymongo";

/**
 * Gateway webhooks. PayMongo is the connected gateway: register
 *   https://<your-domain>/api/webhooks/paymongo   for the event   checkout_session.payment.paid
 * and set PAYMONGO_WEBHOOK_SECRET to its signing secret. The webhook issues the ticket even if the
 * buyer closes the tab before returning; fulfilment is idempotent, so the return and the webhook can both run.
 */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== "paymongo") return NextResponse.json({ error: "This gateway is not connected." }, { status: 404 });

  const event = verifyWebhook(await req.text(), req.headers.get("paymongo-signature"));
  if (!event) return NextResponse.json({ error: "Signature check failed." }, { status: 401 });

  if (event.type === "checkout_session.payment.paid" && event.orderId) {
    const order = await getOrder(event.orderId);
    // Only fulfil an order we created, for the session we created for it.
    if (order && order.sessionId === event.sessionId) await fulfilOrder(order);
  }
  return NextResponse.json({ received: true });
}
