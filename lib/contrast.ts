/** WCAG contrast helpers, used to keep organizer-chosen colours readable. */

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Pick whichever candidate reads best on `bg`. */
export function readableOn(bg: string, candidates: string[] = ["#17140f", "#ffffff"]): string {
  return candidates.reduce((best, c) => (contrast(bg, c) > contrast(bg, best) ? c : best), candidates[0]);
}

export function isHex(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

/** Blend two hex colours: `t` is the share of `b` (0..1). */
export function mix(a: string, b: string, t: number): string {
  const ch = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [x, y] = [ch(a), ch(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

/** Blend `ink` into `bg` until the result reaches `target` contrast against every surface given. */
export function tone(ink: string, bg: string, surfaces: string[], target: number, start: number): string {
  for (let share = start; share < 1; share += 0.04) {
    const c = mix(bg, ink, share);
    if (surfaces.every((s) => contrast(c, s) >= target)) return c;
  }
  return ink;
}
