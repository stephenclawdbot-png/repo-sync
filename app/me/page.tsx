import type { Metadata } from "next";
import { MeClient } from "@/components/MeClient";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "My tickets and stubs" };

export default function MePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "36px", paddingTop: 24 } as React.CSSProperties}>
        <div className="stack">
          <p className="mono">On this device</p>
          <h1 className="h-app">My tickets and stubs</h1>
        </div>
        <MeClient />
      </main>
      <SiteFooter />
    </>
  );
}
