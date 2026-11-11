/** Paid orders that go through a real gateway: created before the redirect, fulfilled once payment is confirmed. */
import { existingTicket, issueTicket, recordReferral } from "./core";
import { findEvent } from "./merchants";
import { store } from "./store";

export interface Order {
  id: string;
  slug: string;
  gid: string;
  name: string;
  tierId: string;
  qty: number;
  ref?: string;
  totalMinor: number;
  sessionId?: string;
  createdAt: number;
}

export const saveOrder = (o: Order) => store.putDoc(`order/${o.id}`, o);
export const getOrder = (id: string) => (/^ord_[a-z0-9]{10}$/.test(id) ? store.getDoc<Order>(`order/${id}`) : Promise.resolve(null));

/**
 * Issue the ticket for a confirmed payment. Safe to call from both the buyer's return and the webhook:
 * the first caller claims the order, later callers just get the ticket that already exists.
 */
export async function fulfilOrder(o: Order): Promise<string | null> {
  const ev = await findEvent(o.slug);
  if (!ev) return null;
  const first = await store.claim(`paid/${o.id}`);
  if (!first) {
    // Someone else (the webhook or another tab) is fulfilling, or already has: wait for their ticket, never issue a second.
    for (let i = 0; i < 6; i++) {
      if (await existingTicket(ev, o.gid)) return issueTicket(ev, { gid: o.gid, name: o.name, via: "buy", tier: o.tierId, admits: o.qty });
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  }
  const held = await existingTicket(ev, o.gid);
  const admits = held?.via === "buy" && held.tier === o.tierId ? held.admits + o.qty : o.qty;
  const token = await issueTicket(ev, { gid: o.gid, name: o.name, via: "buy", tier: o.tierId, admits, replace: true });
  await store.remove(`wait/${ev.slug}/${o.gid}~`);
  await recordReferral(ev, o.gid, o.ref);
  return token;
}
