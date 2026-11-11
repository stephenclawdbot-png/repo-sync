import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Demo video", description: "An 80-second tour of stagepass: RSVP, the pass, the stub, earning, paying and hosting." };

const CHAPTERS = [
  ["0:05", "RSVP in a tap, with plus-ones, from a phone"],
  ["0:15", "The pass: a QR for the door"],
  ["0:22", "Scanned at the door, the pass tears into a numbered stub"],
  ["0:31", "Earn: join, then trade points for a free ticket"],
  ["0:43", "Buy: pay with GCash (sandbox)"],
  ["0:54", "Hosts: the back office and guest list"],
  ["0:59", "Hosts: restyle the storefront and publish"],
  ["1:10", "The live storefront"],
];

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap stack" style={{ "--gap": "24px", paddingTop: 24 } as React.CSSProperties}>
        <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
          <h1 className="h-app">See stagepass in 80 seconds</h1>
          <p className="lede">Recorded from the working product. No sound.</p>
        </div>
        <video
          controls
          playsInline
          preload="metadata"
          poster="/demo/stagepass-demo-poster.jpg"
          aria-describedby="demo-chapters"
          style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--r-xl)", background: "#07070b", boxShadow: "var(--e2)" }}
        >
          <source src="/demo/stagepass-demo.mp4" type="video/mp4" />
        </video>
        <section className="card stack" aria-labelledby="demo-h">
          <h2 id="demo-h" className="h-sub">What the video shows</h2>
          <ol id="demo-chapters" className="detail-list" style={{ boxShadow: "none" }}>
            {CHAPTERS.map(([t, what]) => (
              <li key={t}><span className="digits">{t}</span><span>{what}</span></li>
            ))}
          </ol>
        </section>
        <div className="row">
          <Link className="btn btn--primary" href="/signup">Try it yourself</Link>
          <a className="btn" href="/demo/stagepass-demo.mp4" download>Download the video</a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
