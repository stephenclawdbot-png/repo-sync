"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { type EventDef, formatMoney, paths, platformFee, type Via } from "@/lib/events";
import { useGuest } from "@/lib/guest";
import { LOCAL_METHODS } from "@/lib/payments/router";
import type { PaymentMethod } from "@/lib/payments/types";

export type PublicEvent = Omit<EventDef, "doorCode">;

const TAB_LABEL: Record<Via, string> = { rsvp: "RSVP", buy: "Buy", earn: "Earn" };
const METHOD_LABEL: Record<string, string> = {
  gcash: "GCash", maya: "Maya", qrph: "QR Ph", card: "Card", grabpay: "GrabPay", paypal: "PayPal",
  paynow: "PayNow", promptpay: "PromptPay", duitnow: "DuitNow", qris: "QRIS", apple_pay: "Apple Pay", google_pay: "Google Pay",
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

function TicketLink({ token, children }: { token: string; children: ReactNode }) {
  return (
    <Link className="btn btn--primary btn--block btn--lg" href={`/t/${token}`}>
      {children}
    </Link>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="field">
      <span className="label" id={id}>{label}</span>
      <div className="stepper" role="group" aria-labelledby={id}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer: ${label}`} disabled={value <= min}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More: ${label}`} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function NameField({ value, onChange, label = "Your name" }: { value: string; onChange: (v: string) => void; label?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" autoComplete="name" maxLength={40} required value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

interface FormProps { ev: PublicEvent; refGid?: string; onIssued: (token: string) => void }

/* ------------------------------------------------------------------ RSVP */

interface RsvpResult { status: "going" | "maybe" | "declined" | "waitlisted"; token?: string; admits?: number; earned?: number; position?: number }

function RsvpForm({ ev, refGid, onIssued }: FormProps) {
  const { guest, setName, addTicket } = useGuest();
  const [status, setStatus] = useState<"going" | "maybe" | "declined">("going");
  const [plus, setPlus] = useState(0);
  const [answers, setAnswers] = useState<number[]>(ev.questions.map(() => 0));
  const [name, setLocalName] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<RsvpResult | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { if (guest?.name) setLocalName((n) => n || guest.name); }, [guest]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!guest) return;
    setBusy(true); setErr(""); setRes(null);
    try {
      const r = await post<RsvpResult>("/api/rsvp", { slug: ev.slug, gid: guest.gid, name, status, plusOnes: plus, answers, ref: refGid });
      setName(name);
      if (r.token) { addTicket(r.token); onIssued(r.token); }
      setRes(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (res?.status === "going" && res.token) {
    return (
      <div className="stack" role="status">
        <div className="note note--ok">
          <strong>You’re in{res.admits && res.admits > 1 ? `, with ${res.admits - 1} guest${res.admits > 2 ? "s" : ""}` : ""}.</strong>
          Your ticket is ready{res.earned ? `, and you earned ${res.earned} points with ${ev.org.name}` : ""}.
        </div>
        <TicketLink token={res.token}>Open my ticket</TicketLink>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setRes(null)}>Change my reply</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="stack">
      <fieldset className="seg">
        <legend>Are you coming?</legend>
        {([["going", "Going"], ["maybe", "Maybe"], ["declined", "Can't go"]] as const).map(([v, l]) => (
          <label key={v}>
            <input type="radio" name="status" value={v} checked={status === v} onChange={() => setStatus(v)} />
            {l}
          </label>
        ))}
      </fieldset>

      {status !== "declined" && <NameField value={name} onChange={setLocalName} />}

      {status === "going" && ev.plusOnesMax > 0 && (
        <Stepper label="Bringing guests" value={plus} min={0} max={ev.plusOnesMax} onChange={setPlus} />
      )}

      {status === "going" &&
        ev.questions.map((q, qi) => (
          <div className="field" key={q.id}>
            <label htmlFor={`q-${q.id}`}>{q.label}</label>
            <select id={`q-${q.id}`} value={answers[qi]} onChange={(e) => setAnswers((a) => a.map((v, i) => (i === qi ? Number(e.target.value) : v)))}>
              {q.options.map((o, oi) => <option key={o} value={oi}>{o}</option>)}
            </select>
          </div>
        ))}

      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy ? "Saving…" : status === "going" ? "RSVP and get my ticket" : "Send my reply"}
      </button>
      <p className="hint" style={{ textAlign: "center" }}>Free. No account or app needed.</p>

      <div aria-live="polite" className="stack">
        {err && <div className="note note--bad" role="alert"><strong>That didn’t work</strong>{err}</div>}
        {res?.status === "maybe" && <div className="note"><strong>Marked as maybe.</strong>No spot is held until you say you’re going.</div>}
        {res?.status === "declined" && <div className="note"><strong>Got it.</strong>You’re off the list. You can change your reply any time.</div>}
        {res?.status === "waitlisted" && (
          <div className="note note--warn"><strong>You’re number {res.position} on the waitlist.</strong>This event is full. If a spot opens up, it’s offered to the waitlist in order.</div>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------- Buy */

interface BuyResult { status: "paid" | "waitlisted"; token?: string; admits?: number; gateway?: string; position?: number }

function BuyForm({ ev, refGid, onIssued }: FormProps) {
  const { guest, setName, addTicket } = useGuest();
  const methods = (LOCAL_METHODS[ev.country] ?? ["card"]) as PaymentMethod[];
  const [tierId, setTierId] = useState(ev.tiers[0].id);
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>(methods[0]);
  const [name, setLocalName] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<BuyResult | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { if (guest?.name) setLocalName((n) => n || guest.name); }, [guest]);

  const tier = ev.tiers.find((t) => t.id === tierId)!;
  const subtotal = tier.priceMinor * qty;
  const fee = platformFee(subtotal, qty);
  const money = (m: number) => formatMoney(m, ev.currency);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!guest) return;
    setBusy(true); setErr(""); setRes(null);
    try {
      const r = await post<BuyResult>("/api/checkout", { slug: ev.slug, gid: guest.gid, name, tierId, qty, method, ref: refGid });
      setName(name);
      if (r.token) { addTicket(r.token); onIssued(r.token); }
      setRes(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (res?.status === "paid" && res.token) {
    return (
      <div className="stack" role="status">
        <div className="note note--ok">
          <strong>Paid. Your ticket admits {res.admits}.</strong>
          Sandbox payment routed through {res.gateway}. Nothing was charged.
        </div>
        <TicketLink token={res.token}>Open my ticket</TicketLink>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setRes(null)}>Buy more</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="stack">
      <fieldset className="seg seg--tiers">
        <legend>Ticket</legend>
        {ev.tiers.map((t) => (
          <label key={t.id}>
            <input type="radio" name="tier" value={t.id} checked={tierId === t.id} onChange={() => setTierId(t.id)} />
            <span>{t.name}<small>{t.perks}</small></span>
            <span>{money(t.priceMinor)}</span>
          </label>
        ))}
      </fieldset>

      <Stepper label="How many" value={qty} min={1} max={6} onChange={setQty} />
      <NameField value={name} onChange={setLocalName} label="Name on the ticket" />

      <fieldset className="seg seg--wrap">
        <legend>Pay with</legend>
        {methods.map((m) => (
          <label key={m}>
            <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
            {METHOD_LABEL[m]}
          </label>
        ))}
      </fieldset>

      <div className="totals">
        <div><span>Tickets</span><span>{money(subtotal)}</span></div>
        <div><span>Service fee</span><span>{money(fee)}</span></div>
        <div><span>Total</span><span>{money(subtotal + fee)}</span></div>
      </div>

      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy ? "Paying…" : `Pay ${money(subtotal + fee)} with ${METHOD_LABEL[method]}`}
      </button>
      <p className="hint" style={{ textAlign: "center" }}>Sandbox mode: nothing is charged, and the ticket is issued straight away.</p>

      <div aria-live="polite" className="stack">
        {err && <div className="note note--bad" role="alert"><strong>That didn’t work</strong>{err}</div>}
        {res?.status === "waitlisted" && (
          <div className="note note--warn"><strong>You’re number {res.position} on the waitlist.</strong>There aren’t enough seats left for that order. You haven’t been charged.</div>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Earn */

interface EarnState { balance: number; joined: boolean; shownUp: boolean; invited: number; confirmed: number; pending: number; redeemed: string[]; ticketsLeft: number }

function EarnPanel({ ev, refGid, onIssued }: FormProps) {
  const { guest, setName, addTicket, ticketFor } = useGuest();
  const [state, setState] = useState<EarnState | null>(null);
  const [name, setLocalName] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "bad"; text: string; token?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const earn = ev.earn!;
  const gid = guest?.gid;

  useEffect(() => { if (guest?.name) setLocalName((n) => n || guest.name); }, [guest]);

  const refresh = useCallback(async () => {
    if (!gid) return;
    const r = await fetch(`/api/earn?slug=${ev.slug}&gid=${gid}`);
    if (r.ok) setState(await r.json());
  }, [gid, ev.slug]);
  useEffect(() => { void refresh(); }, [refresh]);

  const invite = typeof window !== "undefined" && gid ? `${window.location.origin}/e/${ev.slug}?ref=${gid}` : "";

  async function join() {
    if (!gid) return;
    setBusy("join"); setMsg(null);
    try { setState(await post<EarnState>("/api/earn", { slug: ev.slug, gid, ref: refGid })); }
    catch (e) { setMsg({ kind: "bad", text: (e as Error).message }); }
    finally { setBusy(""); }
  }

  async function redeem(rewardId: string, title: string) {
    if (!gid) return;
    setBusy(rewardId); setMsg(null);
    try {
      const r = await post<{ token?: string; state: EarnState }>("/api/earn/redeem", { slug: ev.slug, gid, name, rewardId });
      setState(r.state);
      if (r.token) { setName(name); addTicket(r.token); onIssued(r.token); }
      setMsg({ kind: "ok", text: `${title} claimed.`, token: r.token });
    } catch (e) {
      setMsg({ kind: "bad", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* the field is selectable as a fallback */ }
  }

  const done: Record<string, boolean> = { join: Boolean(state?.joined), showup: Boolean(state?.shownUp), refer: (state?.confirmed ?? 0) > 0 };
  const hasTicket = Boolean(ticketFor(ev.slug));
  const needsName = earn.rewards.some((r) => r.kind === "ticket") && !hasTicket;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="num" aria-live="polite">{state ? state.balance : 0} <span style={{ fontSize: "0.5em", fontWeight: 600 }}>points</span></div>
          <p className="hint" style={{ marginTop: 2 }}>with {ev.org.name}</p>
        </div>
        {state && !state.joined && (
          <button className="btn btn--primary" onClick={join} disabled={busy === "join"}>
            {busy === "join" ? "Joining…" : "Join and start earning"}
          </button>
        )}
      </div>

      <div>
        <h3 className="label" style={{ fontFamily: "inherit", letterSpacing: 0 }}>Ways to earn</h3>
        {earn.quests.map((q) => (
          <div className="quest" key={q.id}>
            <strong>{q.title}</strong>
            <small>{q.desc}</small>
            <span className={`chip pts digits ${done[q.id] ? "chip--stub" : ""}`}>{done[q.id] ? "✓ " : "+"}{q.points}</span>
          </div>
        ))}
      </div>

      {state?.joined && (
        <div className="field">
          <label htmlFor="invite">Your invite link</label>
          <div className="invite">
            <input id="invite" type="text" readOnly value={invite} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn btn--sm" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <p className="hint" aria-live="polite">
            {state.invited === 0
              ? "No friends have used it yet."
              : `${state.invited} friend${state.invited > 1 ? "s" : ""} joined through you: ${state.confirmed} scanned in, ${state.pending} still to arrive.`}
          </p>
        </div>
      )}

      <div>
        <h3 className="label" style={{ fontFamily: "inherit", letterSpacing: 0 }}>Trade points for</h3>
        {needsName && state?.joined && <NameField value={name} onChange={setLocalName} label="Name for an earned ticket" />}
        {earn.rewards.map((r) => {
          const claimed = state?.redeemed.includes(r.id);
          const short = Math.max(0, r.cost - (state?.balance ?? 0));
          const blocked = r.kind === "ticket" && (hasTicket || (state?.ticketsLeft ?? 0) < 1);
          const reason = claimed ? "Claimed" : blocked ? (hasTicket ? "You already have a ticket" : "All claimed") : short ? `${short} more points to go` : r.kind === "ticket" && !name.trim() ? "Add a name above" : "";
          return (
            <div className="quest" key={r.id}>
              <strong>{r.title} · {r.cost} pts</strong>
              <small>{r.desc}{reason ? ` ${reason}.` : ""}</small>
              <button className="btn btn--sm pts" onClick={() => redeem(r.id, r.title)} disabled={!state?.joined || Boolean(reason) || busy === r.id}>
                {claimed ? "Claimed" : busy === r.id ? "Claiming…" : "Claim"}
              </button>
            </div>
          );
        })}
      </div>

      <div aria-live="polite" className="stack">
        {msg?.kind === "bad" && <div className="note note--bad" role="alert"><strong>Not yet</strong>{msg.text}</div>}
        {msg?.kind === "ok" && (
          <div className="note note--ok stack">
            <div><strong>{msg.text}</strong>{msg.token ? "Your earned ticket is ready." : "It’s attached to your name at the door."}</div>
            {msg.token && <TicketLink token={msg.token}>Open my ticket</TicketLink>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Panel */

export function EntryPanel({ ev, refGid, spotsLeft }: { ev: PublicEvent; refGid?: string; spotsLeft: number }) {
  const available = paths(ev as EventDef);
  const [tab, setTabState] = useState<Via>(available[0]);
  const [fresh, setFresh] = useState("");
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const setTab = (v: Via) => { setTabState(v); setFresh(""); };
  const { ticketFor } = useGuest();
  const held = ticketFor(ev.slug);
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  // On phones the panel is a bottom sheet: trap the page behind it and give Escape a way out.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  const cheapest = ev.tiers.length ? Math.min(...ev.tiers.map((t) => t.priceMinor)) : 0;
  const sub: Record<Via, string> = {
    rsvp: "Free",
    buy: ev.tiers.length ? `from ${formatMoney(cheapest, ev.currency)}` : "",
    earn: "Points",
  };
  const showHeld = Boolean(held) && held !== fresh && !editing;

  return (
    <>
      <div className="dock">
        <div className="dock__info">
          <strong>{held ? "You’re going" : ev.rsvp ? "Free RSVP" : `From ${formatMoney(cheapest, ev.currency)}`}</strong>
          <span className="muted">{spotsLeft > 0 ? `${spotsLeft.toLocaleString("en")} spots left` : "Full: join the waitlist"}</span>
        </div>
        {held ? (
          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
            {ev.earn && <button ref={openerRef} className="btn" onClick={() => { setTab("earn"); setOpen(true); }}>Earn</button>}
            <Link className="btn btn--primary" href={`/t/${held}`}>View ticket</Link>
          </div>
        ) : (
          <button ref={openerRef} className="btn btn--primary" onClick={() => setOpen(true)}>Get my pass</button>
        )}
      </div>
      <button className={`sheet-backdrop ${open ? "is-open" : ""}`} aria-label="Close" tabIndex={-1} onClick={() => setOpen(false)} />

      <section className={`panel ${open ? "is-open" : ""}`} aria-label="Get in" role={open ? "dialog" : undefined} aria-modal={open ? true : undefined}>
        <div className="panel__grip">
          <button ref={closeRef} className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Close</button>
        </div>
        {available.length > 1 && (
          <div className="tabs" role="tablist" aria-label="Ways in">
            {available.map((v) => (
              <button
                key={v}
                role="tab"
                id={`${id}-tab-${v}`}
                aria-selected={tab === v}
                aria-controls={`${id}-panel`}
                tabIndex={tab === v ? 0 : -1}
                data-via={v}
                onClick={() => setTab(v)}
                onKeyDown={(e) => {
                  const i = available.indexOf(v);
                  const next = e.key === "ArrowRight" ? available[(i + 1) % available.length] : e.key === "ArrowLeft" ? available[(i - 1 + available.length) % available.length] : null;
                  if (next) { setTab(next); document.getElementById(`${id}-tab-${next}`)?.focus(); }
                }}
              >
                <span><span className="dot" aria-hidden="true" />{TAB_LABEL[v]}</span>
                <small>{sub[v]}</small>
              </button>
            ))}
          </div>
        )}
        <div
          className="panel__body stack"
          id={`${id}-panel`}
          role={available.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={available.length > 1 ? `${id}-tab-${tab}` : undefined}
        >
          {showHeld && held && (
            <div className="stack">
              <div className="note note--ok"><strong>You have a ticket for this.</strong>It’s saved on this device.</div>
              <TicketLink token={held}>Open my ticket</TicketLink>
              {tab === "rsvp" && <button className="btn btn--ghost btn--block" onClick={() => setEditing(true)}>Change my reply</button>}
              {tab === "buy" && <button className="btn btn--ghost btn--block" onClick={() => setEditing(true)}>Buy more tickets</button>}
            </div>
          )}
          {tab === "rsvp" && !showHeld && <RsvpForm ev={ev} refGid={refGid} onIssued={setFresh} />}
          {tab === "buy" && !showHeld && <BuyForm ev={ev} refGid={refGid} onIssued={setFresh} />}
          {tab === "earn" && <EarnPanel ev={ev} refGid={refGid} onIssued={setFresh} />}
        </div>
      </section>
    </>
  );
}
