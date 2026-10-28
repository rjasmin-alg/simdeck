<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ddos-amplification: notes

New explorer (task `docs/tasks/w3/ddos-amplification.md`, catalogue `inet-ddos-amplification`, §4.2, wave 3). One
concept: **spoofed small requests become large replies at the victim**. Custom scene (no kit view K1–K4 fits a
three-column amplification picture). Rules, the BAF figures with their source, and expected numbers: `SPEC.md`.

## Decisions

- **No kit view.** The URM ch18 diagram is a sender → reflectors → victim row with arrow widths ∝ bit rate and a
  load gauge on the victim's link. None of K1 (sequence), K2 (topology), K4 (rule table) or K3 (block grid) draws
  that, so the scene is drawn in the page (HTML + kit tokens), like other explorers that carry a bespoke picture
  (e.g. `wifi-channels`). No shared request to the kit owner.
- **BAF figures from the source, not invented.** Each service's factor is a single representative value from
  US-CERT/CISA Alert TA14-017A (checked against the alert, last revised 2019-12-18): DNS 54 (alert row "28 to 54";
  a range is represented by the top, the worst case the attacker exploits, and it matches the book's "nekoliko
  desetaka"), SNMPv2 6.3, SSDP 30.8, NTP 556.9. The caption's factor and arithmetic are computed live from the
  chosen service, so the page text follows the figure (the task's example caption used 50; with the alert's DNS
  value the live caption reads 54 / ~540 Mbit/s).
- **A fourth toggle, `victimFilter`.** The task's param list names three toggles (ingress filtering, reflectors
  closed, rate limit) but preset 5 (`victim-side-filter`) needs a filter *at the victim's edge* to show rule 6c
  ("filtriranje jedne adrese ne pomaže…", and the misconception that a filter at the victim helps). Added it as a
  defence that changes nothing numeric: the access link is already full upstream of it. See `## Deviations`.
- **Defence order is fixed and deterministic** (SPEC.md): ingress filtering zeroes the sent rate at the source and
  dominates (nothing reaches the reflectors); closing the services zeroes the reflected rate; rate-limiting halves
  what is left; the victim-edge filter is numerically inert. `stopped.atSource` wins the caption over
  `atReflector`.
- **Arrow width ∝ rate** via a sqrt scale with a floor and a cap (`thick()` in the page), so the request stays
  visibly thin and the reply visibly thick without NTP's ~5.6 Gbit/s overflowing the scene. Widths are view-only;
  the model has no geometry.
- **Load gauge** fills to `min(load, 100 %)`; a capacity mark sits at the right edge; over capacity the fill turns
  `--danger` **and** is hatched, with the `×`-factor spelled out ("promet premašuje vezu 5.4×") and a "zasićeno"
  badge, so the saturated state survives grayscale and colour blindness. Under capacity, a green "free for
  legitimate traffic" line shows the headroom.
- **"Changed"** is tracked by the page (the state before the last param change; for a preset, the defaults), not
  stored in the state. The request flow, the reply flow and the gauge each get the highlighter + thick outline
  when their number moved.
- **Panel gaps tightened** within the sim's scope (`.sd-panel`/`.sd-group`/`.sd-ctl`/`.sd-presets` gap only, not
  the 44 px targets): seven controls plus five presets otherwise overflow the one-screen panel at 1920×1080.
- **Out of scope** (task, COMMON.md §1 "concepts, not tools"): no reflector lists, attack tooling, botnets, real
  incidents or scrubbing products; the page shows the arithmetic and the defences only. Header overhead and
  queueing detail are ignored, stated on the page and in the explanation.

## Deviations from the task

- **Added the `victimFilter` toggle** (fourth defence), not in the task's three-toggle list, because preset 5
  requires it and it carries the central misconception (rule 6c). It is numerically inert by design. If the owner
  prefers exactly three toggles, drop `victimFilter` and preset 5; recorded in the report's assumptions.
- **DNS BAF = 54** (the alert's documented maximum), not the round "~50" the task's example caption used. The
  live caption reflects the real figure. Preset descriptions still hold: book-dns ~540 Mbit/s on a 1 Gbit/s link
  (~54 %), saturation 540 on 100 (5.4×), larger-factor NTP 5569 on 1000 (exceeds the link).

## Sources

- URM ch18 `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`: "Prijetnje
  i napadi" (DoS/DDoS, amplification over public UDP services, BAF definition, footnote `cisa-drdos`), "Šire o
  temi" (filtering one address does not help), Pitanja 6; diagram `assets/diagrams/ch18-drdos-pojacavanje.svg`.
- US-CERT/CISA Alert TA14-017A "UDP-Based Amplification Attacks" (BAF table; verified online, last revised
  2019-12-18).
- RFC 2827 / BCP 38 "Network Ingress Filtering" (the source-filtering defence).
- `meta/plan-interaktivne-stranice.md` §6 card 11 "Sigurnost" (DRDoS i faktor pojačanja).

## Term pairs (needed, missing from `kit/glossary.js`; written out in both string tables)

The glossary has `spoofing` (lažiranje identiteta) and `handshake` (rukovanje) but not the DRDoS terms, so these
are written out in `strings.js` in both languages rather than as `[[term]]`. Proposed pairs for the coordinator to
add with `"src": "simdeck"`:

- denial of service (DoS) — uskraćivanje usluge
- distributed denial of service (DDoS) — distribuirano uskraćivanje usluge
- amplification — pojačavanje
- bandwidth amplification factor — faktor pojačanja propusnosti
- spoofed source address — lažirana izvorišna adresa
- reflector — reflektor (the book prefers *pojačalo* / "javna UDP usluga")
- ingress filtering — filtriranje na izvoru (BCP 38)
- rate limiting — ograničavanje brzine

## Shared requests

None. The scene needs nothing from the kit views.

## Tags and topic

- topic `internet`, tag `attacks` (both already in `tags.json`). No new tag needed.

## Review

A fresh reviewer (playbook §7.4) read the diff against SPEC.md and broke three rules on purpose to confirm the
tests bite; the model was found correct with no numeric bug. Two fixes applied from it:

- **[fixed] caption/state mismatch**: `capVictimFilter` ("the link is already full, so the load stays N×") was
  appended whenever `victimFilter` was on, even under capacity — contradicting `capUnder` and wrong (a victim
  filter *does* help when the link has headroom). Now appended only when `s.saturated`. Preset 5 is always
  saturated, so it is unaffected.
- **[fixed] dead string keys** removed (`maskHint`, `satBadge`, `bafShown`, and the four unused `hint*` toggle
  strings left over after the per-toggle hints were dropped to fit one screen).

## Time

Start to done: one session (reading → SPEC → model + tests → page → gate green → review), roughly 2 hours of work
including installing the repo's Playwright in a fresh worktree.
