import { NextResponse } from "next/server";
import { award, counts, earnState, existingTicket, issueTicket } from "@/lib/core";
import { getEvent } from "@/lib/events";
import { fail, readJson } from "@/lib/http";
import { store } from "@/lib/store";
import { cleanName, isId } from "@/lib/token";

export async function POST(req: Request) {
  const body = await readJson<{ slug: string; gid: string; name: string; rewardId: string }>(req);
  const ev = body && getEvent(body.slug);
  const reward = ev?.earn?.rewards.find((r) => r.id === body?.rewardId);
  if (!body || !ev || !reward) return fail("That reward does not exist.", 404);
  if (!isId(body.gid)) return fail("Missing guest id.");

  const state = await earnState(ev, body.gid);
  if (state.redeemed.includes(reward.id)) return fail("You have already claimed this reward.", 409);
  if (state.balance < reward.cost) return fail(`You need ${reward.cost - state.balance} more points.`, 409);

  let token: string | undefined;
  if (reward.kind === "ticket") {
    const name = cleanName(body.name);
    if (!name) return fail("Please enter the name for the ticket.");
    if (await existingTicket(ev, body.gid)) return fail("You already have a ticket for this event.", 409);
    if (state.ticketsLeft < 1) return fail("All earnable tickets for this event have been claimed.", 409);
    if ((await counts(ev)).spotsLeft < 1) return fail("This event is full.", 409);
    await award(ev.org.id, body.gid, "redeem", `${ev.slug}.${reward.id}`, -reward.cost);
    token = await issueTicket(ev, { gid: body.gid, name, via: "earn", tier: reward.tierId ?? "list", admits: 1 });
  } else {
    await award(ev.org.id, body.gid, "redeem", `${ev.slug}.${reward.id}`, -reward.cost);
    await store.put(`perk/${ev.slug}/${body.gid}~${reward.id}`);
  }
  return NextResponse.json({ token, state: await earnState(ev, body.gid) });
}
