import { Nav } from "@/components/Nav";
import { PayoutSimulator } from "@/components/PayoutSimulator";

export const metadata = { title: "Payout simulator — Stagepass" };

export default function Dashboard() {
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingBottom: 60 }}>
        <section style={{ paddingTop: 24 }}>
          <h2>When do you get paid?</h2>
          <p className="muted" style={{ maxWidth: "62ch" }}>
            Incumbent platforms typically hold ticket revenue until after the event. Stagepass pays out the day after each
            sale and holds back only a small, risk-based reserve until the event is over.
          </p>
          <PayoutSimulator />
        </section>
      </main>
    </>
  );
}
