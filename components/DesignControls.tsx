"use client";

import { useId } from "react";
import { contrast, isHex, readableOn } from "@/lib/contrast";
import { type Design, type DisplayFont, EVENTS, type Pattern } from "@/lib/events";

const PATTERNS: Pattern[] = ["dots", "stripes", "grid", "waves", "none"];
const FONTS: { id: DisplayFont; label: string }[] = [
  { id: "grotesk", label: "Grotesk" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
];
const GLYPHS = ["✦", "✺", "◆", "◐", "➜", "♪", "☀", "❋"];
const PRESETS = EVENTS.filter((e, i, all) => all.findIndex((x) => x.design.paper === e.design.paper) === i).slice(0, 9);

/** Colours, pattern, type and mark, with a live readability check. Shared by the studio and the back office. */
export function DesignControls({ design: d, onChange }: { design: Design; onChange: (d: Design) => void }) {
  const id = useId();
  const set = <K extends keyof Design>(k: K, v: Design[K]) => onChange({ ...d, [k]: v });
  const inkRatio = contrast(d.paper, d.ink);
  const accentRatio = contrast(d.accent, readableOn(d.accent, [d.ink, d.paper, "#17140f", "#ffffff"]));
  const ok = inkRatio >= 4.5 && accentRatio >= 4.5;

  return (
    <div className="stack">
      <div>
        <span className="label" id={`${id}-p`}>Start from a look</span>
        <div className="swatches" role="group" aria-labelledby={`${id}-p`}>
          {PRESETS.map((e) => (
            <button key={e.slug} type="button" className="swatch" aria-label={`${e.kind} look`} aria-pressed={e.design.paper === d.paper && e.design.accent === d.accent} onClick={() => onChange(e.design)}>
              <span style={{ background: e.design.paper }} />
              <span style={{ background: e.design.accent }} />
            </button>
          ))}
        </div>
      </div>

      <div className="color-row">
        {(["paper", "ink", "accent"] as const).map((k) => (
          <div key={k}>
            <label htmlFor={`${id}-${k}`}>{k === "paper" ? "Paper" : k === "ink" ? "Text" : "Accent"}</label>
            <input id={`${id}-${k}`} type="color" value={d[k]} onChange={(e) => isHex(e.target.value) && set(k, e.target.value)} />
          </div>
        ))}
      </div>
      <div className={`note ${ok ? "note--ok" : "note--warn"}`} role="status">
        <strong>{ok ? "Readable" : "Hard to read"}</strong>
        Text on paper {inkRatio.toFixed(1)}:1, text on accent {accentRatio.toFixed(1)}:1.{" "}
        {ok ? "Both pass the 4.5:1 accessibility minimum." : "Below 4.5:1, so guests see an automatically corrected text colour. Pick a darker or lighter pair to keep your exact colours."}
      </div>

      <fieldset className="seg seg--wrap">
        <legend>Pattern</legend>
        {PATTERNS.map((p) => (
          <label key={p}><input type="radio" name={`${id}-pattern`} checked={d.pattern === p} onChange={() => set("pattern", p)} />{p[0].toUpperCase() + p.slice(1)}</label>
        ))}
      </fieldset>

      <fieldset className="seg">
        <legend>Headline type</legend>
        {FONTS.map((f) => (
          <label key={f.id}><input type="radio" name={`${id}-font`} checked={d.display === f.id} onChange={() => set("display", f.id)} />{f.label}</label>
        ))}
      </fieldset>

      <fieldset className="seg seg--wrap" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
        <legend>Mark</legend>
        {GLYPHS.map((g, i) => (
          <label key={g}><input type="radio" name={`${id}-glyph`} aria-label={`Mark ${i + 1}`} checked={d.glyph === g} onChange={() => set("glyph", g)} /><span aria-hidden="true">{g}</span></label>
        ))}
      </fieldset>
    </div>
  );
}
