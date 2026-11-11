# Stagepass — Design Study & System (v2)

The first design ("paper tickets": cream background, black outlines, hard button shadows, pastel fills,
quirky headline type) was rejected as dated. This version was rebuilt from two independent reviews, a brand
direction and a UI/UX audit, and replaces it entirely.

## 1. Brand

**Idea: "You're in."** Stagepass is the moment at the door. The platform chrome is quiet and neutral so that
each event's own colours take the stage. One accent, ultraviolet, is reserved for the action that gets you in
and for the stub you keep.

Personality: welcoming, crisp, electric. The name is always lowercase: `stagepass`.

### Logo
"The tear": a rounded pass split on a slash, the stub sliding up and away. It also reads as a door swung
open. Two solid shapes, so it survives at 16 px.

- `public/brand/stagepass-mark.svg` (colour) and `stagepass-mark-mono.svg` (`currentColor`)
- `public/brand/stagepass-lockup.svg` and `stagepass-lockup-mono.svg` (mark + wordmark; the wordmark is
  outlined Plus Jakarta Sans 800, so it needs no font)
- `public/brand/stagepass-appicon.svg`, also used as the favicon (`app/icon.svg`)
- In code: `components/Logo.tsx`. On event-themed pages the mark takes the event's text colour.

### Type
| Role | Face | Use |
|---|---|---|
| Headlines | Plus Jakarta Sans 700/800, tight tracking | Page and section titles |
| Text and UI | Inter 400/500/600 | Everything else |
| Digits | Geist Mono 500 | Ticket numbers, door codes, times. Never for labels |
| Event option | Instrument Serif 400 | An organizer's "serif" headline choice |

No all-caps mono labels and no kicker lines above headings. Display tops out at 72 px; app pages use 28–38 px.

### Colour
| Token | Light | Dark |
|---|---|---|
| Background | `#F6F6F9` | `#0B0B10` |
| Surface | `#FFFFFF` | `#16161E` |
| Text | `#0D0D12` | `#F4F4F8` |
| Muted text | `#5A5A6A` | `#A4A4B6` |
| Hairline | `#E3E3EA` | `#2A2A37` |
| Control border | `#85859A` | `#6E6E84` |
| Primary (ultraviolet) | `#5B3DF5`, white text | `#8E7CFF`, dark text |
| Success / warning / danger | `#0B7A4B` `#8F5200` `#C0261B` | `#4ADE9A` `#F5B955` `#FF8A80` |

Ways in and stubs are a **tint + strong foreground**, used only on chips, tab dots and badges, always with a
text label, never as a button fill or a status colour:

| | Light tint / text | Dark tint / text |
|---|---|---|
| RSVP (sky) | `#DFF1FD` / `#075A85` | `#0B2A3F` / `#7CCBFA` |
| Buy (teal) | `#D5F5EA` / `#0A5F4A` | `#0A2E25` / `#5FE0BC` |
| Earn (gold) | `#FDEFC4` / `#7A4B00` | `#33260A` / `#FACC55` |
| Stub (violet) | `#ECE8FF` / `#4526CC` | `#211A52` / `#BDB2FF` |

Every text pair is at least 4.5:1.

### Voice
"Every way in. One pass." · "Get my pass" · "You're in." · "No stubs yet. Your first one is a scan away."

## 2. Interface rules

1. **No ink outlines, no hard shadows.** Separate with surface and soft elevation first (three levels,
   `--e1`…`--e3`), a 1 px hairline second. Only form controls get a visible border.
2. **One filled primary button per view.** Everything else is secondary (surface + border) or ghost.
3. **Radii:** 12 px controls, 16 px cards, 20 px panels and tickets, pills for chips.
4. **Navigation:** 64 px sticky blurred bar on desktop; on phones a 56 px bar with a tickets button and a
   menu sheet. It knows who is signed in on the device.
5. **Phones first for the main action.** On an event page the entry panel is a bottom sheet behind a sticky
   action bar ("Get my pass" / "View ticket"), so the action is never below the fold.
6. **Feedback replaces the form.** After an RSVP or a payment the form is swapped for the result, so nothing
   can be submitted twice by accident. Ticket holders see their status, not an empty form.

## 3. The pass and the stub

`components/Ticket.tsx`, laid out like a wallet pass:

1. Header strip: organizer mark and name, and how the guest got in.
2. Colour block: the event's accent with its pattern, kind and title in the event's headline face.
3. Field grid: date, where, name, ticket.
4. Perforation (dotted line, notched edges), then the code on a white tile, "Admit N" and the ticket number.

Portrait under 560 px of width, boarding-pass layout above it. Three states: **sample**, **ticket** (live
QR), **stub** (the code is replaced by a round "Attended" seal with the entry number; the stub part tears off
and rotates, and plays that tear once when the scan has just happened).

## 4. Event design = five choices

`Design { paper, ink, accent, pattern, display font, mark }`. `designVars()` turns it into CSS variables
and derives the surface, muted text, hairline and control-border colours **with contrast checks**, so an
organizer cannot pick an unreadable pair. A `.themed` wrapper remaps the global tokens, and on themed pages
the primary button is the event's own text colour, so it always passes.

Generated **posters** (`components/Poster.tsx`) give every event artwork without uploads. Storefront options:
header (left / centred / banner), event cards (cards / posters / list), corners (soft / sharp / round),
section order and visibility, announcement bar.

## 5. Ease of access

- Contrast is computed and enforced, including on organizer-chosen colours.
- Touch targets ≥ 44 px; inputs and main buttons 48–56 px.
- Full keyboard support, visible 3 px focus rings, skip link, Escape closes sheets and menus.
- Status is never colour-only: scan results say "✓ Admit 2", "↺ Already scanned", "✕ Not valid".
- Live regions announce results; reduced-motion and forced-colours are respected.
- No app or account needed; "Enlarge QR" gives a full-screen white code; the scanner accepts a pasted code.

Automated check: axe-core (WCAG 2.2 AA + best practice) across every page in light, dark and phone layouts,
including the phone menu and the entry sheet, with zero violations at the time of writing.

## 6. Not done yet (from the UI/UX audit)

Back office sidebar navigation and a three-step "new event" flow; bottom tab bar for signed-in users on
phones; full-screen dark scanner with auto-start camera and torch; stub-only tiles in the collection;
platform-specific single wallet button.
