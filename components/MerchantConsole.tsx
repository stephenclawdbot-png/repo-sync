"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { EventDef } from "@/lib/events";
import { loadMerchantSession, saveMerchantSession, type MerchantSession } from "@/lib/guest";
import { SECTION_LABEL, type CardStyle, type Corners, type EventInput, type HeroStyle, type Merchant, type Storefront } from "@/lib/storefront";
import { DesignControls } from "./DesignControls";
import { StorefrontView } from "./StorefrontView";

type OwnedEvent = EventDef & { counts: { going: number; maybe: number; waitlist: number; checkedIn: number; spotsLeft: number } };
interface Data { merchant: Merchant; events: OwnedEvent[]; maxEvents: number }

const BLANK: EventInput = {
  title: "", kind: "", tagline: "", startsAt: "", hours: 3, venue: "", city: "", capacity: 100,
  rsvp: true, plusOnesMax: 1, question: { label: "", options: [] }, tiers: [{ name: "", price: 0 }, { name: "", price: 0 }], earn: true,
};

export function MerchantConsole() {
  const [session, setSession] = useState<MerchantSession | null | undefined>(undefined);
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"events" | "storefront">("events");
  const [err, setErr] = useState("");

  useEffect(() => setSession(loadMerchantSession()), []);

  const api = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<T> => {
      const res = await fetch(url, { ...init, headers: { "content-type": "application/json", "x-merchant": `${session!.mid}.${session!.key}` } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      return body as T;
    },
    [session],
  );

  const load = useCallback(async () => {
    if (!session) return;
    try { setData(await api<Data>("/api/merchant")); setErr(""); }
    catch (e) { setErr((e as Error).message); }
  }, [session, api]);
  useEffect(() => { void load(); }, [load]);

  function signOut() {
    saveMerchantSession(null);
    setSession(null);
    setData(null);
  }

  if (session === undefined) return <p className="muted" aria-live="polite">Loading…</p>;
  if (!session) {
    return (
      <div className="section stack" style={{ maxWidth: 620 }}>
        <h1 className="h-app">Merchant back office</h1>
        <p className="lede">Sign up as a merchant, or load the demo merchant, to create events and design your storefront.</p>
        <div><Link className="btn btn--primary" href="/signup">Sign up or load the demo</Link></div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="section stack">
        <p className="muted" aria-live="polite">{err ? "" : "Loading your back office…"}</p>
        {err && <div className="note note--bad" role="alert"><strong>Couldn’t open the back office</strong>{err} <button className="btn btn--sm" style={{ marginTop: 10 }} onClick={signOut}>Sign out</button></div>}
      </div>
    );
  }

  const { merchant, events } = data;
  return (
    <div className="console">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "end" }}>
        <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
          <p className="mono">Back office</p>
          <h1 className="h-app">{merchant.name}</h1>
        </div>
        <div className="row">
          <Link className="btn btn--sm btn--primary" href={`/s/${merchant.handle}`}>View live storefront</Link>
          <button className="btn btn--sm" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="console__tabs" role="tablist" aria-label="Back office sections">
        {(["events", "storefront"] as const).map((t) => (
          <button key={t} role="tab" id={`mc-tab-${t}`} aria-selected={tab === t} aria-controls="mc-panel" onClick={() => setTab(t)}>
            {t === "events" ? `Events (${events.length})` : "Storefront design"}
          </button>
        ))}
      </div>

      <div id="mc-panel" role="tabpanel" aria-labelledby={`mc-tab-${tab}`}>
        {tab === "events" ? (
          <EventsTab events={events} max={data.maxEvents} api={api} reload={load} />
        ) : (
          <StorefrontTab merchant={merchant} events={events} api={api} onSaved={(m) => setData({ ...data, merchant: m })} />
        )}
      </div>
    </div>
  );
}

type Api = <T>(url: string, init?: RequestInit) => Promise<T>;

/* ---------------------------------------------------------------- Events */

function EventsTab({ events, max, api, reload }: { events: OwnedEvent[]; max: number; api: Api; reload: () => Promise<void> }) {
  const [f, setF] = useState<EventInput>(BLANK);
  const [options, setOptions] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const setTier = (i: number, patch: Partial<{ name: string; price: number }>) =>
    setF((p) => ({ ...p, tiers: p.tiers.map((t, ti) => (ti === i ? { ...t, ...patch } : t)) }));

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const body: EventInput = { ...f, question: { label: f.question?.label ?? "", options: options.split(",").map((o) => o.trim()).filter(Boolean) } };
      const r = await api<{ event: EventDef }>("/api/merchant/events", { method: "POST", body: JSON.stringify(body) });
      setMsg({ ok: true, text: `“${r.event.title}” is live.` });
      setF(BLANK); setOptions("");
      await reload();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(ev: OwnedEvent) {
    if (!window.confirm(`Delete “${ev.title}” and its guest list?`)) return;
    try { await api(`/api/merchant/events?slug=${ev.slug}`, { method: "DELETE" }); await reload(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  return (
    <div className="stack" style={{ "--gap": "28px" } as React.CSSProperties}>
      <section aria-labelledby="mc-list">
        <h2 id="mc-list" className="sr-only">Your events</h2>
        {events.length === 0 ? (
          <div className="empty"><p>No events yet. Create your first one below.</p></div>
        ) : (
          events.map((ev) => (
            <article className="card ev-row" key={ev.slug}>
              <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                <span className="mono">{ev.kind} · {ev.dateLabel} · {ev.timeLabel}</span>
                <h3>{ev.title}</h3>
                <div className="chips">
                  <span className="chip">{ev.counts.going.toLocaleString("en")} of {ev.capacity.toLocaleString("en")} going</span>
                  <span className="chip">{ev.counts.checkedIn} scanned in</span>
                  {ev.counts.maybe > 0 && <span className="chip">{ev.counts.maybe} maybe</span>}
                  {ev.counts.waitlist > 0 && <span className="chip chip--buy">{ev.counts.waitlist} waiting</span>}
                  {ev.rsvp && <span className="chip chip--rsvp">RSVP</span>}
                  {ev.tiers.length > 0 && <span className="chip chip--buy">Paid</span>}
                  {ev.earn && <span className="chip chip--earn">Earn</span>}
                </div>
                <p className="hint">Door code for staff <span className="code">{ev.doorCode}</span></p>
              </div>
              <div className="row">
                <Link className="btn btn--sm" href={`/e/${ev.slug}`}>Event page</Link>
                <Link className="btn btn--sm" href={`/host/${ev.slug}?door=${ev.doorCode}`}>Guest list</Link>
                <Link className="btn btn--sm" href={`/scan?event=${ev.slug}&door=${ev.doorCode}`}>Scanner</Link>
                <button className="btn btn--sm btn--danger" onClick={() => remove(ev)} aria-label={`Delete ${ev.title}`}>Delete</button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="card stack" aria-labelledby="mc-new">
        <h2 id="mc-new" className="h-sub">New event</h2>
        {events.length >= max ? (
          <p className="muted">The demo allows {max} events per organizer. Delete one to add another.</p>
        ) : (
          <form onSubmit={create} className="stack">
            <div className="form-grid">
              <div className="field"><label htmlFor="ne-title">Event name</label><input id="ne-title" type="text" required maxLength={50} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
              <div className="field"><label htmlFor="ne-kind">Kind</label><input id="ne-kind" type="text" maxLength={20} placeholder="Party, meetup, class…" value={f.kind} onChange={(e) => set("kind", e.target.value)} /></div>
              <div className="field"><label htmlFor="ne-date">Starts (Manila time)</label><input id="ne-date" type="datetime-local" required value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></div>
              <div className="field"><label htmlFor="ne-hours">Length (hours)</label><input id="ne-hours" type="number" min={1} max={24} value={f.hours} onChange={(e) => set("hours", Number(e.target.value))} /></div>
              <div className="field"><label htmlFor="ne-venue">Venue</label><input id="ne-venue" type="text" maxLength={50} value={f.venue} onChange={(e) => set("venue", e.target.value)} /></div>
              <div className="field"><label htmlFor="ne-city">City</label><input id="ne-city" type="text" maxLength={30} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div className="field"><label htmlFor="ne-cap">Capacity</label><input id="ne-cap" type="number" min={1} max={50000} value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} /></div>
            </div>
            <div className="field"><label htmlFor="ne-tag">One-line description</label><input id="ne-tag" type="text" maxLength={120} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>

            <fieldset className="waybox stack">
              <legend><span className="chip chip--rsvp">Way in 1 · RSVP</span></legend>
              <label className="check"><input type="checkbox" checked={f.rsvp} onChange={(e) => set("rsvp", e.target.checked)} />Free RSVP is open</label>
              {f.rsvp && (
                <div className="form-grid">
                  <div className="field"><label htmlFor="ne-plus">Plus-ones allowed</label><input id="ne-plus" type="number" min={0} max={5} value={f.plusOnesMax} onChange={(e) => set("plusOnesMax", Number(e.target.value))} /></div>
                  <div className="field"><label htmlFor="ne-q">Question for guests (optional)</label><input id="ne-q" type="text" maxLength={50} placeholder="Food preference" value={f.question?.label ?? ""} onChange={(e) => set("question", { label: e.target.value, options: [] })} /></div>
                  <div className="field"><label htmlFor="ne-qo">Answer choices, comma-separated</label><input id="ne-qo" type="text" placeholder="Anything, Vegetarian, No pork" value={options} onChange={(e) => setOptions(e.target.value)} /></div>
                </div>
              )}
            </fieldset>

            <fieldset className="waybox stack">
              <legend><span className="chip chip--buy">Way in 2 · Buy</span></legend>
              <p>Leave these blank for a free event. Prices are in pesos.</p>
              {f.tiers.map((t, i) => (
                <div className="form-grid" key={i}>
                  <div className="field"><label htmlFor={`ne-tn-${i}`}>Ticket {i + 1} name</label><input id={`ne-tn-${i}`} type="text" maxLength={30} value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`ne-tp-${i}`}>Ticket {i + 1} price (₱)</label><input id={`ne-tp-${i}`} type="number" min={0} max={500000} value={t.price || ""} onChange={(e) => setTier(i, { price: Number(e.target.value) })} /></div>
                </div>
              ))}
            </fieldset>

            <fieldset className="waybox stack">
              <legend><span className="chip chip--earn">Way in 3 · Earn</span></legend>
              <label className="check"><input type="checkbox" checked={f.earn} onChange={(e) => set("earn", e.target.checked)} />Guests earn points for joining, showing up and bringing friends</label>
              <p>Points buy a free ticket when you sell tickets (capped at 10% of capacity), or a skip-the-line perk when the event is free.</p>
            </fieldset>

            <button className="btn btn--primary" disabled={busy}>{busy ? "Publishing…" : "Publish event"}</button>
          </form>
        )}
        <div aria-live="polite">
          {msg && <div className={`note ${msg.ok ? "note--ok" : "note--bad"}`} role={msg.ok ? "status" : "alert"}><strong>{msg.ok ? "Published" : "Not published"}</strong>{msg.text}</div>}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ Storefront */

function StorefrontTab({ merchant, events, api, onSaved }: { merchant: Merchant; events: OwnedEvent[]; api: Api; onSaved: (m: Merchant) => void }) {
  const [name, setName] = useState(merchant.name);
  const [sf, setSf] = useState<Storefront>(merchant.storefront);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = name !== merchant.name || JSON.stringify(sf) !== JSON.stringify(merchant.storefront);
  const set = <K extends keyof Storefront>(k: K, v: Storefront[K]) => setSf((p) => ({ ...p, [k]: v }));

  function move(i: number, by: number) {
    setSf((p) => {
      const next = [...p.sections];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return { ...p, sections: next };
    });
  }

  async function save() {
    setBusy(true); setMsg("");
    try {
      const r = await api<{ merchant: Merchant }>("/api/merchant", { method: "PUT", body: JSON.stringify({ name, storefront: sf }) });
      onSaved(r.merchant);
      setSf(r.merchant.storefront);
      setMsg("Saved. Your storefront, event pages, tickets and stubs now use this design.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const seg = <T extends string>(legend: string, key: "hero" | "cards" | "corners", opts: [T, string][]) => (
    <fieldset className="seg">
      <legend>{legend}</legend>
      {opts.map(([v, l]) => (
        <label key={v}><input type="radio" name={`sf-${key}`} checked={sf[key] === v} onChange={() => set(key, v as never)} />{l}</label>
      ))}
    </fieldset>
  );

  return (
    <div className="stack">
      <div className="savebar">
        <span aria-live="polite" style={{ fontSize: "0.9375rem" }}>{msg || (dirty ? "You have unsaved changes." : "Everything is published.")}</span>
        <span className="row" style={{ gap: 8 }}>
          {dirty && <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setName(merchant.name); setSf(merchant.storefront); setMsg(""); }}>Discard</button>}
          {dirty && <button type="submit" form="sf-form" className="btn btn--sm btn--primary" disabled={busy}>{busy ? "Saving…" : "Save and publish"}</button>}
        </span>
      </div>
    <div className="console__split">
      <form id="sf-form" className="card stack" onSubmit={(e) => { e.preventDefault(); void save(); }} aria-label="Storefront settings">
        <div className="field"><label htmlFor="sf-name">Name</label><input id="sf-name" type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="sf-tag">Tagline</label><input id="sf-tag" type="text" maxLength={90} value={sf.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="field"><label htmlFor="sf-about">About</label><textarea id="sf-about" rows={4} maxLength={500} value={sf.about} onChange={(e) => set("about", e.target.value)} /></div>
        <div className="field"><label htmlFor="sf-ann">Announcement bar (optional)</label><input id="sf-ann" type="text" maxLength={120} value={sf.announcement} onChange={(e) => set("announcement", e.target.value)} /></div>

        <DesignControls design={sf.design} onChange={(d) => set("design", d)} />

        {seg<HeroStyle>("Header layout", "hero", [["left", "Left"], ["center", "Centred"], ["banner", "Banner"]])}
        {seg<CardStyle>("Event cards", "cards", [["ticket", "Cards"], ["poster", "Posters"], ["list", "List"]])}
        {seg<Corners>("Corners", "corners", [["soft", "Soft"], ["sharp", "Sharp"], ["round", "Round"]])}

        <div>
          <span className="label" id="sf-order">Sections: order and visibility</span>
          <ol className="order" aria-labelledby="sf-order">
            {sf.sections.map((s, i) => (
              <li key={s.id}>
                <label className="check"><input type="checkbox" checked={s.on} onChange={(e) => set("sections", sf.sections.map((x) => (x.id === s.id ? { ...x, on: e.target.checked } : x)))} />{SECTION_LABEL[s.id]}</label>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABEL[s.id]} up`}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === sf.sections.length - 1} aria-label={`Move ${SECTION_LABEL[s.id]} down`}>↓</button>
              </li>
            ))}
          </ol>
        </div>

      </form>

      <div className="stack console__preview">
        <p className="mono">Live preview{dirty ? " · unsaved changes" : ""}</p>
        <div className="sf-frame" tabIndex={0} role="region" aria-label="Storefront preview">
          <StorefrontView merchant={{ name, handle: merchant.handle, storefront: sf }} events={events} preview />
        </div>
      </div>
    </div>
    </div>
  );
}
