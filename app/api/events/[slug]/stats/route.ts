import { NextResponse } from "next/server";
import { counts } from "@/lib/core";
import { getEvent } from "@/lib/events";
import { fail } from "@/lib/http";
import { fields, persistent, store } from "@/lib/store";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const ev = getEvent((await ctx.params).slug);
  if (!ev) return fail("Unknown event.", 404);
  if (new URL(req.url).searchParams.get("door") !== ev.doorCode) return fail("Wrong door code.", 401);

  const [c, rsvps, tix, refs, pts] = await Promise.all([
    counts(ev),
    store.list(`rsvp/${ev.slug}/`),
    store.list(`tix/${ev.slug}/`),
    store.list(`ref/${ev.slug}/`),
    ev.earn ? store.list(`pts/${ev.org.id}/`) : Promise.resolve([]),
  ]);

  const answers = ev.questions.map((q, qi) => ({
    label: q.label,
    options: q.options.map((label, oi) => ({
      label,
      count: rsvps.filter((k) => fields(k)[1] === "going" && fields(k)[3]?.split(".")[qi] === String(oi)).length,
    })),
  }));

  const revenueMinor = tix.reduce((sum, k) => {
    const [, , via, tier, admits] = fields(k);
    const price = ev.tiers.find((t) => t.id === tier)?.priceMinor ?? 0;
    return via === "buy" ? sum + price * Number(admits) : sum;
  }, 0);

  const amounts = pts.map((k) => Number(fields(k)[2]));
  return NextResponse.json({
    counts: c,
    capacity: ev.capacity,
    liveTickets: tix.length,
    answers,
    revenueMinor,
    earn: ev.earn && {
      pointsIssued: amounts.filter((a) => a > 0).reduce((a, b) => a + b, 0),
      pointsSpent: -amounts.filter((a) => a < 0).reduce((a, b) => a + b, 0),
      referrals: refs.length,
      earnedTickets: tix.filter((k) => fields(k)[2] === "earn").length,
      ticketBudget: ev.earn.ticketBudget,
    },
    persistent,
  });
}
