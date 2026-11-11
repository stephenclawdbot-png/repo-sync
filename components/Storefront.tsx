"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { THEMES, METHOD_LABELS, formatMoney, platformFee, type DemoEvent, type Theme } from "@/lib/demo";
import { LOCAL_METHODS } from "@/lib/payments/router";
import type { GatewayId, PaymentMethod } from "@/lib/payments/types";

interface CheckoutResult {
  orderId: string;
  totals: { subtotal: number; platformFee: number; total: number; currency: string };
  routing: {
    gateway: string;
    reason: string;
    estimatedGatewayFee: number;
    candidates: { id: GatewayId; fee: number; healthy: boolean; byo: boolean }[];
  };
  intent: { providerRef: string; nextAction: string };
  payout: { policy: string; payNow: number; reserve: number; payNowDate: string; reserveReleaseDate: string };
}

const ACCENTS = ["#ff4f8b", "#d6451b", "#0f8f86", "#4b3cf5", "#e0a100"];

export function Storefront({ event }: { event: DemoEvent }) {
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [accent, setAccent] = useState(THEMES[0].accent);
  const [tierId, setTierId] = useState(event.tiers[0].id);
  const [qty, setQty] = useState(2);
  const methods = LOCAL_METHODS[event.country] as PaymentMethod[];
  const [method, setMethod] = useState<PaymentMethod>(methods[0]);
  const [byo, setByo] = useState<GatewayId | "">("");
  const [degraded, setDegraded] = useState<GatewayId[]>([]);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tier = event.tiers.find((t) => t.id === tierId)!;
  const subtotal = tier.priceMinor * qty;
  const fee = platformFee(subtotal, qty);
  const fmt = (m: number) => formatMoney(m, event.currency);

  const vars = useMemo(
    () =>
      ({
        "--s-bg": theme.bg,
        "--s-surface": theme.surface,
        "--s-text": theme.text,
        "--s-muted": theme.muted,
        "--s-accent": accent,
        "--s-accent-text": theme.accentText,
        "--s-radius": `${theme.radius}px`,
        fontFamily: theme.font,
      }) as CSSProperties,
    [theme, accent],
  );

  async function checkout() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tierId, qty, method, byoGateway: byo || null, degraded }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const toggleDegraded = (g: GatewayId) =>
    setDegraded((d) => (d.includes(g) ? d.filter((x) => x !== g) : [...d, g]));

  return (
    <div className="sf-root">
      <style>{`
        .sf-root { min-height: 100vh; display: grid; grid-template-columns: 300px 1fr; }
        @media (max-width: 860px) { .sf-root { grid-template-columns: 1fr; } }
        .builder { background: var(--surface); border-right: 1px solid var(--line); padding: 20px; }
        @media (max-width: 860px) { .builder { border-right: 0; border-bottom: 1px solid var(--line); } }
        .builder h4 { margin: 18px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
        .theme-opt { display: block; width: 100%; text-align: left; padding: 10px 12px; margin-bottom: 8px; border-radius: 10px;
          border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; cursor: pointer; }
        .theme-opt[aria-pressed="true"] { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
        .swatches { display: flex; gap: 8px; }
        .swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
        .swatch[aria-pressed="true"] { border-color: var(--text); }
        .toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 6px; }

        .store { background: var(--s-bg); color: var(--s-text); padding: 28px clamp(16px, 4vw, 48px) 60px; }
        .store-inner { max-width: 980px; margin: 0 auto; }
        .store-hero { padding: 28px 0 24px; }
        .store-hero.centered { text-align: center; }
        .store-hero h1 { color: var(--s-text); max-width: none; margin-bottom: 8px; }
        .store-hero p { color: var(--s-muted); margin: 4px 0; }
        .store-body { display: grid; gap: 24px; grid-template-columns: 1.3fr 1fr; }
        .store-body.centered { grid-template-columns: 1fr; max-width: 620px; margin: 0 auto; }
        @media (max-width: 760px) { .store-body { grid-template-columns: 1fr; } }
        .s-card { background: var(--s-surface); border-radius: var(--s-radius); padding: 20px; border: 1px solid color-mix(in srgb, var(--s-text) 10%, transparent); }
        .s-card h3 { color: var(--s-text); }
        .tier { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px; margin-bottom: 10px;
          border-radius: calc(var(--s-radius) * .7); border: 1px solid color-mix(in srgb, var(--s-text) 15%, transparent);
          cursor: pointer; background: transparent; color: var(--s-text); width: 100%; text-align: left; font: inherit; }
        .tier[aria-pressed="true"] { border-color: var(--s-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--s-accent) 35%, transparent); }
        .tier small { color: var(--s-muted); display: block; }
        .pm { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
        .pm button { padding: 10px; border-radius: calc(var(--s-radius) * .6); border: 1px solid color-mix(in srgb, var(--s-text) 18%, transparent);
          background: transparent; color: var(--s-text); font: inherit; font-size: 14px; cursor: pointer; }
        .pm button[aria-pressed="true"] { background: var(--s-accent); color: var(--s-accent-text); border-color: var(--s-accent); }
        .s-btn { width: 100%; padding: 14px; border: 0; border-radius: calc(var(--s-radius) * .7); background: var(--s-accent);
          color: var(--s-accent-text); font: inherit; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 14px; }
        .s-btn:disabled { opacity: .6; }
        .line { display: flex; justify-content: space-between; color: var(--s-muted); font-size: 15px; margin: 4px 0; }
        .line.total { color: var(--s-text); font-weight: 700; font-size: 17px; border-top: 1px solid color-mix(in srgb, var(--s-text) 12%, transparent); padding-top: 8px; margin-top: 8px; }
        .lineup { display: flex; flex-wrap: wrap; gap: 8px; }
        .lineup span { padding: 6px 12px; border-radius: 999px; background: color-mix(in srgb, var(--s-accent) 14%, transparent); color: var(--s-text); font-size: 14px; }
        .result { margin-top: 14px; font-size: 14px; color: var(--s-text); }
        .result dt { color: var(--s-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .05em; margin-top: 10px; }
        .result dd { margin: 2px 0 0; }
        .s-qty { display: flex; align-items: center; gap: 10px; margin: 6px 0 16px; }
        .s-qty button { width: 34px; height: 34px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--s-text) 20%, transparent);
          background: transparent; color: var(--s-text); font-size: 18px; cursor: pointer; }
      `}</style>

      <aside className="builder">
        <Link href="/" className="brand">stage<span>pass</span></Link>
        <p className="muted small" style={{ marginTop: 6 }}>Storefront builder (demo). Changes apply live.</p>

        <h4>Theme</h4>
        {THEMES.map((t) => (
          <button
            key={t.id}
            className="theme-opt"
            aria-pressed={theme.id === t.id}
            onClick={() => { setTheme(t); setAccent(t.accent); }}
          >
            {t.name} <span className="muted small">· {t.layout}</span>
          </button>
        ))}

        <h4>Accent colour</h4>
        <div className="swatches">
          {ACCENTS.map((c) => (
            <button key={c} className="swatch" style={{ background: c }} aria-label={`Accent ${c}`} aria-pressed={accent === c} onClick={() => setAccent(c)} />
          ))}
        </div>

        <h4>Gateway settings</h4>
        <label htmlFor="byo">Bring your own account</label>
        <select id="byo" value={byo} onChange={(e) => setByo(e.target.value as GatewayId | "")}>
          <option value="">None (platform-collected)</option>
          <option value="paymongo">PayMongo</option>
          <option value="xendit">Xendit</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
        </select>

        <h4>Simulate an outage</h4>
        {(["paymongo", "xendit", "stripe", "paypal"] as GatewayId[]).map((g) => (
          <label key={g} className="toggle">
            <input type="checkbox" checked={degraded.includes(g)} onChange={() => toggleDegraded(g)} /> {g} degraded
          </label>
        ))}
      </aside>

      <div className="store" style={vars}>
        <div className="store-inner">
          <div className={`store-hero ${theme.layout}`}>
            <p style={{ color: "var(--s-accent)", fontWeight: 700 }}>{event.date}</p>
            <h1>{event.title}</h1>
            <p>{event.tagline}</p>
            <p>{event.venue}</p>
          </div>

          <div className={`store-body ${theme.layout}`}>
            <div>
              <div className="s-card" style={{ marginBottom: 20 }}>
                <h3>Tickets</h3>
                {event.tiers.map((t) => (
                  <button key={t.id} className="tier" aria-pressed={t.id === tierId} onClick={() => setTierId(t.id)}>
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.perks} · {t.remaining} left</small>
                    </span>
                    <strong>{fmt(t.priceMinor)}</strong>
                  </button>
                ))}
              </div>
              <div className="s-card">
                <h3>Lineup</h3>
                <div className="lineup">{event.lineup.map((a) => <span key={a}>{a}</span>)}</div>
              </div>
            </div>

            <div className="s-card">
              <h3>Checkout</h3>
              <div className="s-qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
                <strong>{qty}</strong>
                <button onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="More">+</button>
                <span style={{ color: "var(--s-muted)" }}>× {tier.name}</span>
              </div>

              <div className="pm">
                {methods.map((m) => (
                  <button key={m} aria-pressed={m === method} onClick={() => setMethod(m)}>{METHOD_LABELS[m]}</button>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="line"><span>Tickets</span><span>{fmt(subtotal)}</span></div>
                <div className="line"><span>Service fee</span><span>{fmt(fee)}</span></div>
                <div className="line total"><span>Total</span><span>{fmt(subtotal + fee)}</span></div>
              </div>

              <button className="s-btn" onClick={checkout} disabled={loading}>
                {loading ? "Routing payment…" : `Pay with ${METHOD_LABELS[method]}`}
              </button>
              <p style={{ color: "var(--s-muted)", fontSize: 12, marginTop: 8 }}>Sandbox. No real charge is made.</p>

              {error && <p className="result" style={{ color: "#d33" }}>{error}</p>}
              {result && (
                <dl className="result">
                  <dt>Routed to</dt>
                  <dd><strong>{result.routing.gateway}</strong> ({result.routing.reason})</dd>
                  <dt>Candidates (est. gateway cost)</dt>
                  <dd>
                    {result.routing.candidates.map((c) => (
                      <div key={c.id}>
                        {c.id}: {fmt(c.fee)} {c.byo ? "· your account" : ""} {c.healthy ? "" : "· degraded"}
                      </div>
                    ))}
                  </dd>
                  <dt>Next step for buyer</dt>
                  <dd>{result.intent.nextAction.replace("_", " ")} · {result.intent.providerRef}</dd>
                  <dt>Organizer payout ({result.payout.policy})</dt>
                  <dd>
                    {fmt(result.payout.payNow)} on {result.payout.payNowDate}; {fmt(result.payout.reserve)} reserve released{" "}
                    {result.payout.reserveReleaseDate}
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
