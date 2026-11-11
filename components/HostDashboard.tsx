"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/events";
import { POLICIES, splitSale } from "@/lib/payouts";

interface Stats {
  counts: { going: number; maybe: number; waitlist: number; checkedIn: number; scans: number; spotsLeft: number; byVia: { rsvp: number; buy: number; earn: number } };
  capacity: number;
  liveTickets: number;
  answers: { label: string; options: { label: string; count: number }[] }[];
  revenueMinor: number;
  earn?: { pointsIssued: number; pointsSpent: number; referrals: number; earnedTickets: number; ticketBudget: number };
  persistent: boolean;
}

const VIA = [
  { key: "rsvp", label: "RSVP", color: "var(--mint)" },
  { key: "buy", label: "Bought", color: "var(--marigold)" },
  { key: "earn", label: "Earned", color: "var(--salmon)" },
] as const;

export function HostDashboard({ slug, currency, paid, initialDoor = "" }: { slug: string; currency: string; paid: boolean; initialDoor?: string }) {
  const [door, setDoor] = useState(initialDoor);
  const [entered, setEntered] = useState(initialDoor);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!entered) return;
    const r = await fetch(`/api/events/${slug}/stats?door=${encodeURIComponent(entered)}`).catch(() => null);
    if (!r) return setErr("No connection.");
    if (r.status === 401) { setStats(null); return setErr("That door code is not right."); }
    if (r.ok) { setErr(""); setStats(await r.json()); }
  }, [slug, entered]);

  useEffect(() => {
    void load();
    const t = setInterval(() => !document.hidden && void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  function submit(e: FormEvent) { e.preventDefault(); setEntered(door.trim()); }

  async function reset() {
    if (!window.confirm("Clear all demo activity for this event (tickets, RSVPs, scans and its organizer's points)?")) return;
    const r = await fetch(`/api/events/${slug}/reset`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ door: entered }) });
    setMsg(r.ok ? "Demo activity cleared." : "Could not clear it.");
    void load();
  }

  if (!stats) {
    return (
      <form onSubmit={submit} className="card stack" style={{ maxWidth: 420 }}>
        <div className="field">
          <label htmlFor="h-door">Door code</label>
          <input id="h-door" type="text" inputMode="numeric" autoComplete="off" value={door} onChange={(e) => setDoor(e.target.value)} aria-describedby="h-hint" />
          <p className="hint" id="h-hint">Sample events use 2468. Your own events show their code in the back office.</p>
        </div>
        <button className="btn btn--ink">Open dashboard</button>
        <p role="alert" style={{ color: "var(--bad)", fontWeight: 650 }}>{err}</p>
      </form>
    );
  }

  const c = stats.counts;
  const total = Math.max(1, c.going);
  const policy = POLICIES.established;
  const payout = splitSale(stats.revenueMinor, policy, new Date(), new Date());

  return (
    <div className="stack" style={{ "--gap": "26px" } as React.CSSProperties}>
      <div className="stats" aria-live="polite">
        <div className="card"><div className="num">{c.going.toLocaleString("en")}</div><p className="muted">going of {stats.capacity.toLocaleString("en")}</p></div>
        <div className="card"><div className="num">{c.checkedIn.toLocaleString("en")}</div><p className="muted">scanned in</p></div>
        <div className="card"><div className="num">{c.maybe}</div><p className="muted">maybe</p></div>
        <div className="card"><div className="num">{c.waitlist}</div><p className="muted">on the waitlist</p></div>
      </div>

      <section className="card stack" aria-labelledby="h-via">
        <h2 id="h-via" style={{ fontSize: "1.4rem" }}>How guests got in</h2>
        {VIA.map((v) => (
          <div className="bar" key={v.key}>
            <span>{v.label}</span>
            <div className="bar__track"><div className="bar__fill" style={{ width: `${(c.byVia[v.key] / total) * 100}%`, background: v.color }} /></div>
            <strong>{c.byVia[v.key].toLocaleString("en")}</strong>
          </div>
        ))}
        <p className="hint">Includes the guests seeded for the demo, plus {stats.liveTickets} live ticket{stats.liveTickets === 1 ? "" : "s"} issued through this site.</p>
      </section>

      {stats.answers.map((a) => (
        <section className="card stack" key={a.label}>
          <h2 style={{ fontSize: "1.4rem" }}>{a.label}</h2>
          {a.options.map((o) => (
            <div className="bar" key={o.label}>
              <span>{o.label}</span>
              <div className="bar__track"><div className="bar__fill" style={{ width: `${(o.count / Math.max(1, stats.liveTickets)) * 100}%`, background: "var(--sky)" }} /></div>
              <strong>{o.count}</strong>
            </div>
          ))}
          <p className="hint">Answers from live RSVPs.</p>
        </section>
      ))}

      {stats.earn && (
        <section className="card stack" aria-labelledby="h-earn">
          <h2 id="h-earn" style={{ fontSize: "1.4rem" }}>Earn</h2>
          <div className="stats">
            <div><div className="num">{stats.earn.pointsIssued}</div><p className="muted">points issued</p></div>
            <div><div className="num">{stats.earn.pointsSpent}</div><p className="muted">points spent</p></div>
            <div><div className="num">{stats.earn.referrals}</div><p className="muted">friends referred</p></div>
            {stats.earn.ticketBudget > 0 && <div><div className="num">{stats.earn.earnedTickets}/{stats.earn.ticketBudget}</div><p className="muted">earnable tickets claimed</p></div>}
          </div>
        </section>
      )}

      {paid && (
        <section className="card stack" aria-labelledby="h-pay">
          <h2 id="h-pay" style={{ fontSize: "1.4rem" }}>Payouts (sandbox)</h2>
          <p>Live ticket sales: <strong>{formatMoney(stats.revenueMinor, currency)}</strong></p>
          <p className="muted">
            On the {policy.label.toLowerCase()} tier, {formatMoney(payout.payNow, currency)} would be paid out the next business day and{" "}
            {formatMoney(payout.reserve, currency)} held in reserve until {policy.releaseDaysAfterEvent} days after the event.
          </p>
        </section>
      )}

      <div className="row">
        <button className="btn btn--sm" onClick={reset}>Clear demo activity</button>
        <span aria-live="polite" className="muted">{msg}</span>
      </div>
      {!stats.persistent && <p className="hint">Running without a database connection: activity is kept in memory and resets when the server restarts.</p>}
    </div>
  );
}
