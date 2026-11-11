"use client";

import { useMemo, useState } from "react";
import { POLICIES, riskTier, type RiskTier } from "@/lib/payouts";
import { formatMoney } from "@/lib/demo";

/**
 * Compares cumulative cash received per week of a 10-week on-sale:
 *  - "hold until after event": all revenue lands 1 week after the event ends
 *  - Stagepass: (1 - reserve) of each week's sales lands within that week; reserve after event
 */
export function PayoutSimulator() {
  const [weeklySales, setWeeklySales] = useState(500_000_00);
  const [weeks, setWeeks] = useState(10);
  const [events, setEvents] = useState(4);
  const [cb, setCb] = useState(0.2);
  const [months, setMonths] = useState(8);

  const tier: RiskTier = riskTier({
    eventsCompleted: events,
    chargebackRate: cb / 100,
    refundRate: 0.02,
    kycVerified: true,
    monthsActive: months,
  });
  const policy = POLICIES[tier];

  const rows = useMemo(() => {
    const out: { week: number; legacy: number; ours: number }[] = [];
    let ours = 0;
    for (let w = 1; w <= weeks + 1; w++) {
      if (w <= weeks) ours += Math.round(weeklySales * (1 - policy.reserveRate));
      else ours += Math.round(weeklySales * weeks * policy.reserveRate);
      out.push({ week: w, legacy: w <= weeks ? 0 : weeklySales * weeks, ours });
    }
    return out;
  }, [weeklySales, weeks, policy]);

  const max = weeklySales * weeks;
  const fmt = (m: number) => formatMoney(m, "PHP");
  const midpoint = rows[Math.floor(weeks / 2) - 1];

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="row">
        <div>
          <label htmlFor="ws">Weekly ticket sales (₱)</label>
          <input id="ws" type="number" min={1000} step={10000} value={weeklySales / 100}
            onChange={(e) => setWeeklySales(Math.max(0, Number(e.target.value)) * 100)} />
        </div>
        <div>
          <label htmlFor="wk">Weeks on sale before the event</label>
          <input id="wk" type="number" min={1} max={26} value={weeks}
            onChange={(e) => setWeeks(Math.min(26, Math.max(1, Number(e.target.value))))} />
        </div>
        <div>
          <label htmlFor="ev">Events completed</label>
          <input id="ev" type="number" min={0} value={events} onChange={(e) => setEvents(Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label htmlFor="cb">Chargeback rate (%)</label>
          <input id="cb" type="number" min={0} step={0.1} value={cb} onChange={(e) => setCb(Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label htmlFor="mo">Months on Stagepass</label>
          <input id="mo" type="number" min={0} value={months} onChange={(e) => setMonths(Math.max(0, Number(e.target.value)))} />
        </div>
      </div>

      <p style={{ marginTop: 18 }}>
        Your tier: <strong>{policy.label}</strong>. Payouts{" "}
        {policy.settleDays === 0 ? "instant on request" : `T+${policy.settleDays} business days after each sale`},{" "}
        {Math.round(policy.reserveRate * 100)}% reserve released {policy.releaseDaysAfterEvent} days after the event.
      </p>
      {midpoint && (
        <p className="muted">
          Halfway through your on-sale you&apos;d already have <strong className="good">{fmt(midpoint.ours)}</strong> in the
          bank, compared with <strong className="warn">{fmt(0)}</strong> under a hold-until-after-the-event model.
        </p>
      )}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr><th>Week</th><th>Hold until after event</th><th>Stagepass rolling payouts</th><th style={{ width: "35%" }}></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.week}>
                <td>{r.week <= weeks ? `Week ${r.week}` : "After event"}</td>
                <td>{fmt(r.legacy)}</td>
                <td className="good">{fmt(r.ours)}</td>
                <td>
                  <div style={{ height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${max ? (r.ours / max) * 100 : 0}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
