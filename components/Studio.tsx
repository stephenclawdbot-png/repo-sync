"use client";

import { useState } from "react";
import { contrast, isHex, readableOn } from "@/lib/contrast";
import { type Design, designVars, type DisplayFont, EVENTS, type Pattern } from "@/lib/events";
import { Ticket } from "./Ticket";

const PATTERNS: Pattern[] = ["dots", "stripes", "grid", "waves", "none"];
const FONTS: { id: DisplayFont; label: string }[] = [
  { id: "grotesk", label: "Grotesk" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
];
const GLYPHS = ["✦", "✺", "◆", "◐", "➜", "♪", "☀", "❋"];

export function Studio() {
  const [title, setTitle] = useState("Your Event Name");
  const [kind, setKind] = useState("Party");
  const [date, setDate] = useState("Sat 14 Mar 2027 · 8:00 PM");
  const [venue, setVenue] = useState("The Venue");
  const [d, setD] = useState<Design>(EVENTS[2].design);
  const set = <K extends keyof Design>(k: K, v: Design[K]) => setD((p) => ({ ...p, [k]: v }));

  const inkRatio = contrast(d.paper, d.ink);
  const onAccent = readableOn(d.accent, [d.ink, d.paper, "#17140f", "#ffffff"]);
  const accentRatio = contrast(d.accent, onAccent);
  const inkOk = inkRatio >= 4.5;
  const accentOk = accentRatio >= 4.5;

  const common = { design: d, kind, title, dateLabel: date, venue, org: "Your name here" };

  return (
    <div className="studio">
      <form className="card stack" onSubmit={(e) => e.preventDefault()} aria-label="Design controls">
        <div>
          <span className="label" id="st-presets">Start from</span>
          <div className="swatches" role="group" aria-labelledby="st-presets">
            {EVENTS.map((e) => (
              <button
                key={e.slug}
                type="button"
                className="swatch"
                aria-label={`${e.kind} style`}
                aria-pressed={e.design === d}
                onClick={() => setD(e.design)}
              >
                <span style={{ background: e.design.paper }} />
                <span style={{ background: e.design.accent }} />
              </button>
            ))}
          </div>
        </div>

        <div className="field"><label htmlFor="st-title">Event name</label><input id="st-title" type="text" maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label htmlFor="st-kind">Kind</label><input id="st-kind" type="text" maxLength={20} value={kind} onChange={(e) => setKind(e.target.value)} /></div>
        <div className="field"><label htmlFor="st-date">Date and time</label><input id="st-date" type="text" maxLength={40} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label htmlFor="st-venue">Where</label><input id="st-venue" type="text" maxLength={40} value={venue} onChange={(e) => setVenue(e.target.value)} /></div>

        <div className="color-row">
          {(["paper", "ink", "accent"] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`st-${k}`}>{k === "paper" ? "Paper" : k === "ink" ? "Text" : "Accent"}</label>
              <input id={`st-${k}`} type="color" value={d[k]} onChange={(e) => isHex(e.target.value) && set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <div className={`note ${inkOk && accentOk ? "note--ok" : "note--warn"}`} role="status">
          <strong>{inkOk && accentOk ? "Readable" : "Hard to read"}</strong>
          Text on paper {inkRatio.toFixed(1)}:1, text on accent {accentRatio.toFixed(1)}:1.{" "}
          {inkOk && accentOk
            ? "Both pass the 4.5:1 accessibility minimum."
            : "Below 4.5:1, so guests see an automatically corrected text colour. Pick a darker or lighter pair to keep your exact colours."}
        </div>

        <fieldset className="seg seg--wrap">
          <legend>Pattern</legend>
          {PATTERNS.map((p) => (
            <label key={p}><input type="radio" name="pattern" checked={d.pattern === p} onChange={() => set("pattern", p)} />{p[0].toUpperCase() + p.slice(1)}</label>
          ))}
        </fieldset>

        <fieldset className="seg">
          <legend>Headline type</legend>
          {FONTS.map((f) => (
            <label key={f.id}><input type="radio" name="font" checked={d.display === f.id} onChange={() => set("display", f.id)} />{f.label}</label>
          ))}
        </fieldset>

        <fieldset className="seg seg--wrap" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
          <legend>Mark</legend>
          {GLYPHS.map((g, i) => (
            <label key={g}><input type="radio" name="glyph" aria-label={`Mark ${i + 1}`} checked={d.glyph === g} onChange={() => set("glyph", g)} /><span aria-hidden="true">{g}</span></label>
          ))}
        </fieldset>

        <p className="hint">This studio is a preview. Publishing your own event needs host accounts, which are the next build step.</p>
      </form>

      <div className="studio__preview" aria-label="Live preview">
        <div>
          <p className="mono" style={{ marginBottom: 8 }}>Event page</p>
          <div className="themed mini-page" style={designVars(d)}>
            <span className="chip">{kind}</span>
            <p className="mini-page__title">{title}</p>
            <p className="muted">{date} · {venue}</p>
            <div className="row" style={{ marginTop: 14 }}>
              <span className="btn btn--sm" style={{ background: "var(--e-accent)", color: "var(--e-on-accent)" }}>RSVP</span>
              <span className="btn btn--sm">Buy</span>
              <span className="btn btn--sm">Earn</span>
            </div>
          </div>
        </div>
        <div>
          <p className="mono" style={{ marginBottom: 8 }}>Ticket</p>
          <Ticket {...common} name="Guest Name" tier="Guest list" state="sample" />
        </div>
        <div>
          <p className="mono" style={{ marginBottom: 8 }}>Stub, after the door scan</p>
          <Ticket {...common} name="Guest Name" tier="Guest list" state="stub" serial="0042" />
        </div>
      </div>
    </div>
  );
}
