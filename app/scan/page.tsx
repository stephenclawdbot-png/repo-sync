import type { Metadata } from "next";
import { Scanner } from "@/components/Scanner";
import { SiteHeader } from "@/components/SiteHeader";
import { UPCOMING } from "@/lib/events";
import { findEvent } from "@/lib/merchants";

export const metadata: Metadata = { title: "Door scanner" };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ event?: string; door?: string }> }) {
  const { event: initial, door } = await searchParams;
  const events = UPCOMING.map((e) => ({ slug: e.slug, title: e.title }));
  // An event created by a merchant is not in the sample list: add it when the link names it.
  if (initial && !events.some((e) => e.slug === initial)) {
    const own = await findEvent(initial);
    if (own && !own.past) events.unshift({ slug: own.slug, title: own.title });
  }
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "22px", paddingBlock: "16px 64px", maxWidth: 760 } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
          <p className="mono">For door staff</p>
          <h1 style={{ fontSize: "clamp(2.2rem,6vw,3.6rem)" }}>Door scanner</h1>
          <p className="muted">Runs in the browser on any phone. Sample events use door code <strong>2468</strong>; your own events show theirs in the back office.</p>
        </div>
        <Scanner events={events} initial={initial} initialDoor={door} />
      </main>
    </>
  );
}
