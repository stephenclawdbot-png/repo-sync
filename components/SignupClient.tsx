"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveMerchantSession, useGuest, type Guest, type MerchantSession, type Profile } from "@/lib/guest";

const handleOf = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

export function SignupClient() {
  const router = useRouter();
  const { guest, setProfile, replaceGuest } = useGuest();
  const [gName, setGName] = useState("");
  const [gCity, setGCity] = useState("");
  const [mName, setMName] = useState("");
  const [mHandle, setMHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState<{ side: "guest" | "merchant"; text: string } | null>(null);

  const okToReplace = () =>
    !guest?.tickets.length || window.confirm("This replaces the tickets saved on this device with the demo guest’s. Continue?");

  function guestSignup(e: FormEvent) {
    e.preventDefault();
    const name = gName.trim();
    if (name.length < 2) return setErr({ side: "guest", text: "Enter your name." });
    const since = new Date().toLocaleDateString("en", { month: "long", year: "numeric" });
    setProfile(name, { handle: handleOf(name).replace(/-/g, ""), city: gCity.trim().slice(0, 30), since, demo: false });
    router.push("/me");
  }

  async function demoGuest() {
    if (!okToReplace()) return;
    setBusy("demo-guest"); setErr(null);
    try {
      const d = await post<{ gid: string; name: string; tokens: string[]; profile: Profile }>("/api/demo/guest");
      const next: Guest = { gid: d.gid, name: d.name, tickets: d.tokens, profile: d.profile };
      replaceGuest(next);
      router.push("/me");
    } catch (e) {
      setErr({ side: "guest", text: (e as Error).message });
      setBusy("");
    }
  }

  async function merchantSignup(e: FormEvent) {
    e.preventDefault();
    setBusy("merchant"); setErr(null);
    try {
      saveMerchantSession(await post<MerchantSession>("/api/merchant/signup", { name: mName, handle: mHandle || handleOf(mName) }));
      router.push("/dashboard");
    } catch (e) {
      setErr({ side: "merchant", text: (e as Error).message });
      setBusy("");
    }
  }

  async function demoMerchant() {
    setBusy("demo-merchant"); setErr(null);
    try {
      saveMerchantSession(await post<MerchantSession>("/api/demo/merchant"));
      router.push("/dashboard");
    } catch (e) {
      setErr({ side: "merchant", text: (e as Error).message });
      setBusy("");
    }
  }

  return (
    <div className="choice">
      <section className="card" aria-labelledby="su-g">
        <span className="chip chip--rsvp choice__tag">Guest</span>
        <h2 id="su-g" style={{ fontSize: "1.9rem" }}>I’m going to things</h2>
        <p className="muted">A profile, your tickets, your stub collection and your points in one place.</p>
        <form onSubmit={guestSignup} className="stack">
          <div className="field"><label htmlFor="su-gn">Your name</label><input id="su-gn" type="text" autoComplete="name" maxLength={40} value={gName} onChange={(e) => setGName(e.target.value)} /></div>
          <div className="field"><label htmlFor="su-gc">City (optional)</label><input id="su-gc" type="text" autoComplete="address-level2" maxLength={30} value={gCity} onChange={(e) => setGCity(e.target.value)} /></div>
          <button className="btn btn--primary btn--block">Create my guest account</button>
        </form>
        <button className="btn btn--block" onClick={demoGuest} disabled={busy === "demo-guest"}>
          {busy === "demo-guest" ? "Loading Mika’s account…" : "Use the demo guest: Mika Reyes"}
        </button>
        <p className="hint">Mika has three upcoming tickets, three stubs and enough points to claim a free concert ticket.</p>
        <p role="alert" style={{ color: "var(--bad)", fontWeight: 650 }}>{err?.side === "guest" ? err.text : ""}</p>
      </section>

      <section className="card" aria-labelledby="su-m">
        <span className="chip chip--buy choice__tag">Merchant</span>
        <h2 id="su-m" style={{ fontSize: "1.9rem" }}>I’m hosting</h2>
        <p className="muted">A back office to create events and watch the guest list, and a public storefront you design yourself.</p>
        <form onSubmit={merchantSignup} className="stack">
          <div className="field">
            <label htmlFor="su-mn">Organizer or business name</label>
            <input id="su-mn" type="text" autoComplete="organization" maxLength={40} value={mName} onChange={(e) => { setMName(e.target.value); if (!handleEdited) setMHandle(handleOf(e.target.value)); }} />
          </div>
          <div className="field">
            <label htmlFor="su-mh">Storefront address</label>
            <input id="su-mh" type="text" autoComplete="off" maxLength={24} value={mHandle} onChange={(e) => { setHandleEdited(true); setMHandle(handleOf(e.target.value)); }} aria-describedby="su-mh-h" />
            <p className="hint" id="su-mh-h">Your storefront will be at /s/{mHandle || "your-name"}</p>
          </div>
          <button className="btn btn--primary btn--block" disabled={busy === "merchant"}>{busy === "merchant" ? "Creating…" : "Create my merchant account"}</button>
        </form>
        <button className="btn btn--block" onClick={demoMerchant} disabled={busy === "demo-merchant"}>
          {busy === "demo-merchant" ? "Setting up the market…" : "Use the demo merchant: Likha Weekend Market"}
        </button>
        <p className="hint">Comes with a designed storefront, three events and a guest list already filling up.</p>
        <p role="alert" style={{ color: "var(--bad)", fontWeight: 650 }}>{err?.side === "merchant" ? err.text : ""}</p>
      </section>

      <p className="hint" style={{ gridColumn: "1 / -1" }}>
        Demo sign-up has no password or email check: the account lives in this browser. Real accounts with phone or email verification are the next step before launch.
      </p>
    </div>
  );
}
