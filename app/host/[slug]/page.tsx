import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HostDashboard } from "@/components/HostDashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { getEvent } from "@/lib/events";

export const metadata: Metadata = { title: "Host dashboard" };

export default async function HostPage({ params }: { params: Promise<{ slug: string }> }) {
  const ev = getEvent((await params).slug);
  if (!ev) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "24px", paddingBlock: "16px 64px" } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
          <p className="mono">Host view · {ev.org.name}</p>
          <h1 style={{ fontSize: "clamp(2.2rem,6vw,3.6rem)" }}>{ev.title}</h1>
          <div className="row">
            <Link className="btn btn--sm" href={`/e/${ev.slug}`}>Event page</Link>
            <Link className="btn btn--sm btn--ink" href={`/scan?event=${ev.slug}`}>Open door scanner</Link>
          </div>
        </div>
        <HostDashboard slug={ev.slug} currency={ev.currency} paid={ev.tiers.length > 0} />
      </main>
    </>
  );
}
