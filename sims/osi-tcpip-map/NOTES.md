<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# osi-tcpip-map: notes

New explorer (task `docs/tasks/w3/osi-tcpip-map.md`, catalogue `net-osi-tcpip-map`, §4.1, wave 3). No kit view: the
task names none, and two layer columns with a card tray are not one of K1–K4. Rules, tie-breaks and the answer
table: `SPEC.md`.

## Decisions

- **One grid, shared tracks.** OSI and TCP/IP sit on the same seven row tracks, so the TCP/IP application row is
  exactly as tall as OSI 5–7 and the link row as tall as OSI 1–2; the mapping bands between them (a trapezoid per
  TCP/IP row, labelled "OSI 5–7 →") show the merges without any drawing. With TCP/IP alone the rows are equal.
- **Click a card, then a row** (the kit has no drag and drop, as the task says). Every row has a full-size hit button
  under its words; cards are buttons above it, so no button is nested in another. Clicking a placed card selects it
  again; a second row moves it, the yellow "put it back" button in the tray returns it.
- **Devices get a bracket** in a lane on the outer side of their column (left of OSI, right of TCP/IP), from layer 1
  up to the row they were placed on, numbered like the card. A wrong placement keeps its bracket dashed red; a
  revealed answer is dotted.
- **Reveal is live checking.** With "Check" on, placed cards show ✓ / ≈ / ✕ (border style and the mark, not colour
  alone; ✕ is also struck through), unplaced cards appear dotted with → at their answer in every visible column that
  has one, and placing a card shows its verdict at once. The one-line reason shows in the caption when a card is
  clicked (and as the card's tooltip), not as a list on the stage: ten reasons do not fit at 1920×1080 in Croatian.
  With Check off the caption only says where the card went and how many are placed, so the class can work first.
- **Presets have Check off** (the spec's "Revealed: …" in `book-devices` is read as the expected answer, not as the
  preset's state); the lecturer turns it on.
- **Placements are page state.** They clear when the set changes, when a preset is (re)loaded, when R resets, and with
  K or the tray's "All back" button. The kit does not tell a page about a reset, so the page watches the R key and the
  reset buttons (`aria-keyshortcuts="R"`) in the capture phase and sets a flag that lives for that event only; the
  render the reset causes then clears the placements. A card in a hidden column waits in the tray and comes back when the column is shown; a
  card on the 5-layer physical row shows on the link row when the 5-layer toggle is off, and returns when it is on.
- **5-layer TCP/IP keeps the name "internetski"** for its third row: the task says the variant only splits physical
  off link; the Kurose naming (mrežni) would change two things at once.
- **PDU names per row:** bitovi / okvir / paket / segment ili datagram / podaci. Layer 1 "bits" and 5–7 "data" are
  not named in the book's PDU paragraph; they are the usual teaching pair (X.200 speaks of bits at the physical
  layer). The explanation says the names are a convention (Primjer 4).
- **Series colours** as in `encapsulation`: c1 application (OSI 5–7), c2 transport, c3 network/internet, c4 link
  (OSI 1–2); the physical rows add a hatch so 1 and 2 differ in grayscale.
- **Vocab set always shows both columns**: the model control is disabled there with the reason written out.
- **Firewall accepts 3 or 4 only;** its reason names the application firewall as a different kind, so a ✕ on 7 is
  explained rather than contradicted.
- **Problem and sentence cards** carry their full statement in the tray (q_ strings) and a short label once placed.

## Deviations from the task

- **Legend without the four layer colours.** With them the header legend wrapped the title onto two lines and the
  panel no longer fitted at 1920×1080. Every row names its layer next to its colour stripe, so the stage carries that
  key itself; the legend keeps bracket, ✓, ≈, ✕ and "just placed".
- **`set` has a fifth value, `extra`,** for the `extra-devices` preset (hub, AP, L3 switch, firewall): the task's four
  sets had no tray for it.
- **TLS added to the protocols tray** (10 cards, not 9), because rule 6 defines its behaviour and a rule without a
  card would be dead. *(check)*
- **The task's state `{ placed, reveal }`:** `reveal` is a param (as the task's params list has it); `placed` maps a
  card to a row id (`o1`…`o7`, `ta`, `tt`, `ti`, `tl`, `tp`) rather than a layer number, since a TCP/IP row covers
  several OSI layers. `check` takes `layers5` as its third argument instead of a model name (the row id names the
  model); notes come from a separate `note()`.
- **The "cards back" control is a K key and a button in the tray,** not a panel button: the panel did not fit.
- **The toggles have no hint lines,** for the same reason; the explanation covers the 5-layer count.

## Sources

- Task file "Model and presets"; URM `book/chapters/04-slojeviti-modeli.md`: "OSI model i njegovih sedam slojeva"
  (seven layers, Croatian names), "TCP/IP model…" (four layers, who looks how deep), "Pet slojeva u praksi",
  "Preslikavanje koje nije čisto ni na dnu stoga" (figure `ch04-osi-tcpip-preslikavanje`), "Enkapsulacija… imena
  podatkovnih jedinica"; Primjer 1 (problems, wording of the five cards), Primjer 3 (devices), Primjer 4 (names are
  a convention), Primjer 5 (the three sentences, verbatim in Croatian).
- URM `07-podatkovni-sloj.md` "Koncentrator: uređaj koji je struka formalno umirovila"; `17-bezicne-mreze.md` "WLAN i
  IEEE 802.11" (access point at the switch/bridge level, not a router).
- ITU-T X.200 §6.1.2 (seven layers); RFC 1122 §1.1.3 (four layers).
- Unchecked, marked in SPEC: ARP 2 or 3, TLS 5–7 / application, L3 switch 2–3, firewall 3–4 (application firewall
  to 7): the book places none of them.

## Checks

- Numbers: an independent Python re-implementation (verdicts for the SPEC's tie-break list, primary TCP/IP answers
  with 4 and 5 layers) before the model; the tests assert the same table.
- Mutations, one at a time, every one caught by `sim.test.js` (17): OSI with six rows; 5-layer link still covering
  1–2; application covering only 6–7; switch at 3; AP at 3; Ethernet accepting 1; ARP single answer; both-ok on one
  accepting row; out-of-order at 3; no "TCP/IP does not name it" note for 6; no vocab model check; vocab not forcing
  both columns; answer on the last accepted layer; tp not folded into tl; score counting hidden columns; physical
  note on any row covering 1; `place` mutating its input.
- Page driven in a headless browser beyond the gate: placing, moving, returning, K, R, model switches (placements
  survive a hidden column), set change, reveal in every set, 5-layer TCP/IP alone, vocab, phone with placements and
  with reveal (no sideways scroll), no console errors.
- Gate: `npm run gate -- osi-tcpip-map` passes; screenshots (light, dark, grayscale, help, panel hidden, phone, both
  languages) reviewed.

- Fresh review (a separate agent read the diff against `SPEC.md` and the book, ran 20 mutations of its own in a
  scratch copy and read every string). Fixed from it: R after a hand-changed param kept the placements (now the reset
  is watched, above); "two answers" wording where TLS has three (now "more than one answer"); the firewall reason
  said an application firewall reads to 7 while 7 is judged wrong (now it says that is a different kind of device);
  the caption still named a card's old row after its column was hidden; the out-of-order note said "network" on the
  TCP/IP internet row; Croatian phrasing in `r_resume`, `q_order` and the bracket's screen-reader label; a missing test
  that the physical-part note stays off other wrong rows (its one surviving non-equivalent mutant).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

layer — sloj; physical / data link / network layer — fizički / podatkovni / mrežni sloj; internet layer —
internetski sloj; transport layer — transportni sloj; session / presentation / application layer — sjednički /
prezentacijski / aplikacijski sloj; protocol data unit — protokolna podatkovna jedinica (PDU); switch — preklopnik;
router — usmjernik; hub — koncentrator; packet — paket; segment — segment; datagram — datagram; OSI reference model
— referentni model OSI. (`frame` — okvir is in the glossary and used as `[[frame]]`.)

## Shared requests

None. (A kit hook telling the page that R reset the params would remove the limitation above; not needed for this
sim.)

## Tags

Topic `networks`, tag `encapsulation` (as the task names; both exist in `tags.json`). Suggested leaf in `learn.json`:
`networks / layers / encapsulation`, first in its list, before `encapsulation` (the layers first, then what each
layer adds).

## Time

2026-11-08 19:59 → 20:18 (about 20 minutes wall clock, by the session's clock), one session: spec, check script,
model and tests, page, gate, review and fixes.
