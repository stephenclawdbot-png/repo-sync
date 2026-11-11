import type { Metadata } from "next";
import { SignupClient } from "@/components/SignupClient";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "30px", paddingTop: 20 } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
          <p className="mono">Two sides, two demos</p>
          <h1 style={{ fontSize: "clamp(2.3rem,6.5vw,4.4rem)", maxWidth: "15ch" }}>Going out, or hosting?</h1>
          <p className="lede">Sign up to try either side for real, or load a ready-made demo account to see what it looks like once it has some history.</p>
        </div>
        <SignupClient />
      </main>
      <SiteFooter />
    </>
  );
}
