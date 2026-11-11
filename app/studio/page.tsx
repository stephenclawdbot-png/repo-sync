import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Studio } from "@/components/Studio";

export const metadata: Metadata = { title: "Design studio" };

export default function StudioPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "26px", paddingTop: 16 } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
          <p className="mono">For hosts</p>
          <h1 className="h-app">Design studio</h1>
          <p className="lede">One design drives the event page, the ticket, the wallet pass and the stub. Change it here and watch all of them follow.</p>
        </div>
        <Studio />
      </main>
      <SiteFooter />
    </>
  );
}
