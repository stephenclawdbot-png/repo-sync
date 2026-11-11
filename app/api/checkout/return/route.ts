import { NextResponse } from "next/server";
import { fulfilOrder, getOrder } from "@/lib/orders";
import { paymongoLive, sessionPaid } from "@/lib/payments/paymongo";

/** Where PayMongo sends the buyer after paying. We confirm with PayMongo before issuing anything. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = await getOrder(url.searchParams.get("order") ?? "");
  if (!order) return NextResponse.redirect(new URL("/me", url.origin));
  const back = (state: string) => NextResponse.redirect(new URL(`/e/${order.slug}?pay=${state}`, url.origin));
  if (!paymongoLive() || !order.sessionId) return back("pending");
  try {
    if (!(await sessionPaid(order.sessionId))) return back("pending");
    const token = await fulfilOrder(order);
    return token ? NextResponse.redirect(new URL(`/t/${token}`, url.origin)) : back("pending");
  } catch (e) {
    console.error("checkout return failed", e);
    return back("pending");
  }
}
