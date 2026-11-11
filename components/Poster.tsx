import { type Design, designVars } from "@/lib/events";

/** Generated poster art: no photos needed, and it always matches the event's design. */
export function Poster({ design, kind, big, small }: { design: Design; kind: string; big: string; small?: boolean }) {
  return (
    <div className={`poster ${small ? "poster--sm" : ""}`} data-pattern={design.pattern} style={designVars(design)}>
      <span className="poster__glyph" aria-hidden="true">{design.glyph}</span>
      <span className="mono">{kind}</span>
      <span className="poster__big">{big}</span>
    </div>
  );
}
