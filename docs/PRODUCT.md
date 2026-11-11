# Stagepass — Product Study

> **What it is:** an RSVP platform for *any* gathering. A guest gets in one of three ways:
> **RSVP** (free), **Buy** (paid ticket), or **Earn** (do something for the organizer and get a ticket).
> Every entry becomes a QR ticket, and after the event it becomes a collectible **stub**.
> Organizers can customize all of it: the page, the form, the ticket, the stub.
>
> Payments are one module, not the product. This document supersedes the payments-first framing in
> `ARCHITECTURE.md` and `BUSINESS.md`; the payment and payout design there still applies to the Buy path.

---

## 1. Landscape: who does what today

| Product | Strong at | Weak at / gap for us |
|---|---|---|
| **Eventbrite** | Discovery marketplace, paid ticketing, reserved seating | Fixed page template; payouts sent 3 business days *after the event*; PayPal is the fallback processor where its own isn't available; no earn mechanics; no keepsake |
| **Luma** | Beautiful event pages, RSVP with approval (payment held until approved), custom registration questions, calendars people subscribe to, CSV export, API | Aimed at tech/community events; limited form logic; no earn-a-ticket; SEA local payments not a focus |
| **Partiful** | Social RSVPs (Going / Maybe / Can't go), text blasts, date polls, shared photo roll, guests need no app or account | Parties only; thin ticketing; little organizer branding |
| **HelixPay** | PH local payments, big on-sales, QR scanning, anti-scalping | Paid ticketing only; no free RSVP layer, earn or stubs |
| **Referral add-ons** (Ticket Fairy, SeeTickets Fan Share, Refrl, ambassador schemes) | Reward buyers for bringing friends: merch, fast lane, up to a free ticket; points exchanged for prizes | Bolt-ons to paid ticketing; nothing for free events; not a general "earn" system |
| **POAP / Ticketmaster collectibles / Peer It** | Proof-of-attendance collectibles, raffle entries, loyalty | Mostly crypto-wallet based, which loses mainstream guests |

**The opening:** nobody combines *RSVP for everything* + *paid tickets with local payments* + *earn a ticket* +
*a stub you keep*, with real customization. Each exists separately; fans also clearly miss physical stubs
(replica-stub printing is now its own business).

---

## 2. Three ways in

| Path | Guest does | Organizer controls |
|---|---|---|
| **RSVP** | Taps Going / Maybe / Can't go; answers questions; optionally brings plus-ones | Capacity, approval, waitlist, plus-one limit, who can see the guest list, invite-only links |
| **Buy** | Picks a tier and pays with a local method | Tiers, promo codes, group deals, pay-what-you-want, deposits, fees absorbed or passed on |
| **Earn** | Completes quests (refer friends, volunteer, attend earlier events…) and redeems points for a ticket, upgrade or perk | Which quests exist, point values, reward catalogue, caps and budget |

All three end in the same object: a **ticket** (signed QR + Wallet pass) that turns into a **stub** at check-in.
One event can mix all three: free RSVP for general entry, paid VIP, and 50 earnable tickets for ambassadors.

---

## 3. Feature map

`MVP` = first release · `V1` = soon after · `Later` = when demand shows

### 3.1 "RSVP for everything": event types
- Single events, **recurring series** (weekly run club), **multi-session** (conference tracks), online / hybrid with join link — `MVP` single + online; `V1` recurring, multi-session
- Templates per use case: party, meetup, concert, conference, class/workshop, fun run, wedding, school/church, pop-up, webinar — `MVP` 5 templates
- Private (link-only), unlisted, public/discoverable — `MVP`

### 3.2 RSVP & registration
- Going / Maybe / Can't go, plus-ones with names — `MVP`
- Capacity + automatic waitlist with timed offers when a spot frees up — `MVP`
- Approval mode (apply → host approves; for paid tiers, hold the card and capture on approval) — `V1`
- Custom questions (text, choice, consent, dietary, accessibility needs), conditional logic — `MVP` basic, `V1` conditional
- **No account, no app**: RSVP with phone or email + one-time code — `MVP`
- Invite lists, per-guest links, "who's going" visibility controls — `V1`
- Add to calendar (Google / Apple / .ics) — `MVP`

### 3.3 Buy
- Tiers, early bird, promo and access codes, group bundles, add-ons (merch, parking) — `MVP` tiers + promo
- Multi-gateway local payments, rolling payouts, bring-your-own gateway (see `ARCHITECTURE.md` §4.4–4.6) — `MVP` 2 gateways
- Pay-what-you-want, donations, deposits / installments — `V1`
- Reserved seating, timed entry — `Later`

### 3.4 Earn (the differentiator; design in §4)
- Referral quest: bring N friends who RSVP or buy — `MVP`
- Share, follow organizer, complete profile, early RSVP — `MVP`
- Attendance streaks ("3 events → free ticket to the 4th"), volunteer shifts, staff-awarded points on site — `V1`
- Leaderboards, raffles (each stub or point = an entry), ambassador teams — `V1`
- Sponsor-funded quests (visit a booth, scan a sponsor QR) — `Later`

### 3.5 Tickets & entry
- Signed QR ticket on a web page, works offline once loaded — `MVP`
- **Apple Wallet** and **Google Wallet** passes with live updates (time/venue change) — `MVP`
  - Apple: needs an Apple Developer account and a Pass Type ID certificate. The richer *poster event ticket*
    layout (iOS 26+) needs extra semantic tags and is limited to sports and live-performance events;
    everything else uses the standard event pass.
  - Google: needs a Wallet issuer account; event tickets use a class + object model.
- Rotating QR (refreshes every 30 s) for high-demand events to stop screenshot resale — `V1`
- Transfer to a friend; controlled resale with price cap — `V1`
- **Scanner** web app: camera scan, manual search, offline mode with sync, multiple doors — `MVP`
- Self check-in kiosk QR, badge printing — `Later`

### 3.6 Stubs (design in §5)
- Ticket converts to a stub at check-in; customizable artwork — `MVP`
- Personal stub collection (public profile optional), share-as-image — `MVP`
- Numbered / rare variants, organizer-added photos or setlist after the event — `V1`
- Stubs unlock perks: presale access, discounts, streak rewards — `V1`
- Optional on-chain export for organizers who want it — `Later`

### 3.7 Customization
- **Page**: themes, colours, fonts, cover media, layout blocks, custom domain, embeddable widget — `MVP` themes; `V1` domain + embed
- **Form**: custom questions and consent text — `MVP`
- **Ticket & stub design**: template editor (background, logo, colours, field placement) shared by web ticket, Wallet pass and stub — `MVP` templates; `V1` editor
- **Messages**: branded email / SMS templates, sender name — `V1`
- **Rules**: quests, points, perks, approval, waitlist behaviour — `MVP`
- Headless API + webhooks for fully custom builds — `Later`

### 3.8 Communication & community
- Confirmation + reminder emails, SMS / WhatsApp / Viber blasts, schedule-change alerts — `MVP` email; `V1` SMS/chat
- Date polls before the event; comments / Q&A on the page — `V1`
- Shared photo album after the event (feeds the stub) — `V1`
- Organizer **calendar** that guests follow; free or paid memberships — `V1`

### 3.9 Organizer tools
- Guest list with statuses, CSV export, check-in live count — `MVP`
- Analytics: RSVP → show-up rate, referral tree, sales by method, earn cost — `V1`
- Team roles (owner, editor, door staff), multi-organizer co-hosting — `V1`

### 3.10 Ease of access (applies to every surface)
- WCAG 2.2 AA: contrast, keyboard, screen-reader labels, visible focus, 44 px touch targets, reduced motion — `MVP`, enforced by automated checks in CI
- No app and no account for guests; one-time code sign-in — `MVP`
- Light pages for slow connections; ticket works offline — `MVP`
- Languages: English + Filipino first, then Bahasa, Thai, Vietnamese — `V1`
- Accessibility-needs question on RSVP; accessible seating / companion ticket tiers — `V1`
- High-contrast, enlarged QR mode with screen-brightness boost at the door — `MVP`

---

## 4. Earn engine

**Model:** quests award **points**; points redeem for **rewards**. Points are per organizer (optionally per
event), so one organizer's budget never pays for another's.

```
Quest      { trigger, points, limit_per_guest, total_budget, window }
Reward     { type: ticket | upgrade | discount | merch | perk, cost_points, stock }
PointEntry { guest, organizer, amount, reason, source_event }   ← append-only ledger
```

| Trigger | Counts when | Typical abuse | Control |
|---|---|---|---|
| Referral | Friend's RSVP is **checked in**, or friend's purchase clears refund window | Fake accounts, self-referral | Verified phone, one device/payment method per guest, credit on check-in not on sign-up |
| Share | Link gets N unique verified visits | Bot clicks | Count verified RSVPs only for meaningful points |
| Attendance streak | Check-in scans | Ticket passed around | Scan tied to guest identity |
| Volunteer / staff award | Door or staff app grants points | Collusion | Per-staff caps, audit log |

**Economics.** An earned ticket's top value is the ticket price, so cap any single reward at one ticket.
Vendors of referral tools report roughly 20–30 % more ticket income with under 1 % of sales given back as
rewards. Treat these as vendor claims to test, not as a forecast. Organizers set a **budget** (e.g. 50 earnable
tickets); the engine stops awarding ticket rewards when it runs out and falls back to perks.

**Free events:** "earn" still works. Rewards are skip-the-line, reserved spot when capacity is full, plus-one
allowance, merch, or priority for the next event.

---

## 5. Stubs

- **When:** created at first successful check-in scan (or at event end for online events with attendance).
  No-shows keep an expired ticket, not a stub. That is what makes a stub proof of attendance.
- **What it holds:** event, date, venue, tier/seat, serial number (`#0421 of 1,800`), artwork, optional
  post-event extras the organizer adds (photos, setlist, speaker slides, a thank-you note).
- **Design:** same template system as the ticket; the organizer can supply different art per tier, plus limited
  variants (first 100 through the door, VIP foil).
- **Where it lives:** in the guest's Stagepass collection, in Apple/Google Wallet (the pass updates to its
  "attended" state), and as a shareable image for social.
- **What it does:** unlocks presales and discounts, counts toward streak quests, serves as a raffle entry.
- **No crypto by default.** A stub is a signed record in our database. That keeps sign-up to a phone number.
  On-chain export can come later as an organizer option.

---

## 6. Decisions needed from you

1. **First market and audience**: Philippines community and campus events first (free RSVP heavy), or paid
   concerts first? It decides whether RSVP/Earn or Buy gets built out first.
2. **Pricing of free events**: free forever for free RSVPs (growth engine, costs us SMS and hosting), with
   revenue from paid tickets and a Pro plan?
3. **Discovery**: a public "what's on" marketplace like Eventbrite, or organizer-owned pages only like Luma?
4. **Stubs on-chain**: never, optional later (recommended), or core?
5. **Name**: "Stagepass" is a placeholder.

---

## 7. Prototype status

Built and live: RSVP core, signed QR tickets, door scanner, stubs and collection, Earn (quests, referrals,
points, rewards with budgets), sandbox Buy, Wallet pass builders (waiting on Apple/Google credentials),
guest accounts, merchant back office with event creation, customizable storefronts, ten sample events,
one-click demo accounts for both sides.

Not built yet: real accounts (phone/email verification), live payment gateways and payouts, approval mode,
recurring events, transfers and resale, messaging (SMS/chat blasts), photo albums, Postgres storage.

## 8. Recommended build order

1. **RSVP core**: event page, Going/Maybe/Can't go, questions, capacity + waitlist, one-time-code sign-in.
2. **Ticket + entry**: signed QR, Apple/Google Wallet pass, scanner.
3. **Stubs**: check-in → stub, collection page, share image.
4. **Earn v1**: referral quest + points ledger + ticket reward with budget cap.
5. **Buy**: tiers + two gateways + rolling payouts (router and payout policy already prototyped).
6. **Customization editor**: ticket/stub template editor, custom domain, embed.

Accessibility checks run from step 1, not as a later pass.

---

## Sources
- Eventbrite payouts and processors: https://www.eventbrite.com/help/en-us/articles/640593/
- Luma vs Eventbrite / Meetup / Partiful: https://help.luma.com/p/luma-vs-eventbrite · https://help.luma.com/p/luma-vs-meetup · https://help.luma.com/p/luma-vs-partiful · https://docs.luma.com/llms.txt
- Partiful: https://apps.apple.com/app/id1662982304 · https://sourceforge.net/software/product/Partiful/
- HelixPay: https://helixpay.ph/ticketing · https://www.cbinsights.com/company/helixpay
- Referral programmes: https://www.ticketfairy.com/blog/the-roi-of-built-in-referral-marketing-real-numbers-from-real-festivals · https://intercom.help/eventree/en/articles/3376849-ambassador-schemes-an-introduction-for-organisers · https://info.ticketsignup.io/2026/08/10/multiple-referral-refund-tiers-for-ticket-events/
- Collectibles and stubs: https://amt-lab.org/blog/2022/9/poaps-audience-engagement-and-memorabilia-in-the-web3-era · https://techcrunch.com/2022/08/31/ticketmaster-taps-the-flow-blockchain-to-let-event-organizers-issue-nfts-tied-to-tickets · https://www.piworld.com/article/from-screen-to-stub-souvenir-tickets-are-making-a-comeback
- Wallet passes: https://developer.apple.com/documentation/walletpasses/creating-an-event-pass-using-semantic-tags.md · https://www.passcreator.com/en/solutions/enhanced-event-tickets-in-apple-wallet
