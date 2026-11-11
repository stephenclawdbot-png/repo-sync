"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/events";
import { POLICIES, riskTier } from "@/lib/payouts";

/** Cash in the bank week by week: paid after the event, versus rolling payouts with a small reserve. */
export function PayoutSimulator() {
  const [weekly, setWeekly] = useState(500000);
  const [weeks, setWeeks] = useState(8);
  const [events, setEvents] = useState(4);
  const [months, setMonths] = useState(8);

  const policy = POLICIES[riskTier({ eventsCompleted: events, chargebackRate: 0.002, refundRate: 0.02, kycVerified: true, monthsActive: months })];
  const rows = useMemo(() => {
    const out: { label: string; after: number; rolling: number }[] = [];
    let rolling = 0;
    for (let w = 1; w <= weeks; w++) {
      rolling += Math.round(weekly * 100 * (1 - policy.reserveRate));
      out.push({ label: `Week ${w}`, after: 0, rolling });
    }
    out.push({ label: "After the event", after: weekly * 100 * weeks, rolling: weekly * 100 * weeks });
    return out;
  }, [weekly, weeks, policy]);
  const max = weekly * 100 * weeks || 1;
  const php = (m: number) => formatMoney(m, "PHP");

  return (
    <div className="card stack">
      <div className="grid-3">
        <div><label htmlFor="ps-w">Weekly ticket sales (₱)</label><input id="ps-w" type="number" min={0} step={10000} value={weekly} onChange={(e) => setWeekly(Math.max(0, Number(e.target.value)))} /></div>
        <div><label htmlFor="ps-n">Weeks on sale</label><input id="ps-n" type="number" min={1} max={20} value={weeks} onChange={(e) => setWeeks(Math.min(20, Math.max(1, Number(e.target.value))))} /></div>
        <div><label htmlFor="ps-e">Events you’ve run</label><input id="ps-e" type="number" min={0} value={events} onChange={(e) => setEvents(Math.max(0, Number(e.target.value)))} /></div>
        <div><label htmlFor="ps-m">Months with us</label><input id="ps-m" type="number" min={0} value={months} onChange={(e) => setMonths(Math.max(0, Number(e.target.value)))} /></div>
      </div>
      <p aria-live="polite">
        <strong>{policy.label} tier:</strong> paid {policy.settleDays === 0 ? "instantly on request" : `${policy.settleDays} business day${policy.settleDays > 1 ? "s" : ""} after each sale`}, with{" "}
        {Math.round(policy.reserveRate * 100)}% held until {policy.releaseDaysAfterEvent} days after the event.
      </p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Payout comparison table">
        <table>
          <thead><tr><th scope="col">When</th><th scope="col">Paid after the event</th><th scope="col">Rolling payouts</th><th scope="col" style={{ width: "34%" }}><span className="sr-only">Share of total</span></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" style={{ fontFamily: "inherit", fontSize: "inherit", letterSpacing: 0, textTransform: "none", color: "inherit" }}>{r.label}</th>
                <td>{php(r.after)}</td>
                <td><strong>{php(r.rolling)}</strong></td>
                <td><div className="bar__track" aria-hidden="true"><div className="bar__fill" style={{ width: `${(r.rolling / max) * 100}%`, background: "var(--marigold)" }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
