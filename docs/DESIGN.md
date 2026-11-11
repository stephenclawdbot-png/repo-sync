# Stagepass — Design Study & System

## 1. What the references do

| Product | Look | What we take | What we avoid |
|---|---|---|---|
| **Luma** | White page, one sentence, one button | One clear action per screen | Looking like every other minimal SaaS page |
| **Partiful** | Black, loud condensed type, party photos | Personality; events should feel like the host | Depending on photography we don't have |
| **Eventbrite** | Orange marketplace: search bar, category icons, photo banners | Breadth ("for every kind of event") | Busy pages, and its orange |

All three lean on photos. None uses the **ticket** as its identity, and none gives you anything to keep.
So the ticket and its stub are our visual system.

## 2. Idea: paper tickets

Old admission rolls come in a few paper colours. We use them with meaning:

| Colour | Token | Means |
|---|---|---|
| Mint | `--mint` `#bfe8d0` | RSVP (free) |
| Marigold | `--marigold` `#ffd25e` | Buy (paid) |
| Salmon | `--salmon` `#ffb3a1` | Earn (points) |
| Sky | `--sky` `#b9d4ff` | Stubs |

They sit on warm paper (`--paper` `#f6f1e7`) with near-black ink (`--ink` `#17140f`), and always carry dark
text, so every pairing passes WCAG AA. Dark mode swaps paper and ink; the ticket colours stay.

**Type:** Bricolage Grotesque (headlines), Instrument Sans (text), Geist Mono (ticket labels and serials).
Fonts are bundled with the app, not fetched from a third party.

**Shape language:** 1.5 px ink outlines, hard "ticket booth" button shadows, dashed perforations, notched
edges, mono serial numbers.

## 3. The Ticket component

One component (`components/Ticket.tsx`) renders three states from one design:

- **sample**: previews and marketing ("Admit One")
- **ticket**: live, with the QR
- **stub**: after the door scan; the side tears off, rotates, and is stamped "Attended No. 0421"

Notches are CSS masks, so the ticket sits on any background. It lays out side-by-side when wide and stacked
when narrow, using a container query. The QR is always black on white, whatever the event's colours.

## 4. Event design = five choices

`Design { paper, ink, accent, pattern, display font, mark }`

A `.themed` wrapper remaps the global tokens (`--paper`, `--ink`, `--card`, `--muted`, `--line`) to the
event's colours, so every component (buttons, forms, panels) follows the event without per-component themes.
The same design drives the event page, the poster art, the ticket, the Apple/Google Wallet pass colours, the
stub and the merchant's storefront.

**Posters** (`components/Poster.tsx`) are generated from the design (accent, pattern, giant mark, date), so
events look designed without anyone uploading artwork.

**Storefront layout options:** header (left / centred / banner), event cards (tickets / posters / list),
corners (soft / sharp / round), section order and visibility, announcement bar.

## 5. Ease of access rules

1. **Contrast is enforced, not hoped for.** `lib/contrast.ts` checks organizer colours; text that would fall
   below 4.5:1 is swapped for a readable colour, and the editor says so.
2. Touch targets are at least 44 px; inputs and buttons are 48 px.
3. Everything works by keyboard; focus rings are 3 px and always visible. A skip link is on every page.
4. Status is never colour-only: scan results say "✓ Admit 2", "↺ Already scanned", "✕ Not valid".
5. Live regions announce results (RSVP confirmed, scan result, points).
6. Reduced-motion and forced-colours modes are respected.
7. No app, no account: a guest can RSVP with a name. Tickets persist on the device.
8. "Show big QR" gives a full-screen, white-background code; the scanner accepts a pasted code as a fallback.

Automated check: axe-core (WCAG 2.2 AA + best practice) on every page, in light, dark and phone layouts,
with zero violations at the time of writing.
