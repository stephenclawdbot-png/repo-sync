import type { Metadata } from "next";
import { Scanner } from "@/components/Scanner";
import { SiteHeader } from "@/components/SiteHeader";
import { EVENTS } from "@/lib/events";

export const metadata: Metadata = { title: "Door scanner" };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const initial = (await searchParams).event;
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "22px", paddingBlock: "16px 64px", maxWidth: 760 } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
          <p className="mono">For door staff</p>
          <h1 style={{ fontSize: "clamp(2.2rem,6vw,3.6rem)" }}>Door scanner</h1>
          <p className="muted">Runs in the browser on any phone. Demo door code for every event: <strong>2468</strong>.</p>
        </div>
        <Scanner events={EVENTS.map((e) => ({ slug: e.slug, title: e.title }))} initial={initial} />
      </main>
    </>
  );
}
