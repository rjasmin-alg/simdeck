# csma-ca-rts-cts: CSMA/CA and RTS/CTS

| | |
|---|---|
| Task | `csma-ca-rts-cts` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-csma-ca-rts-cts` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/csma-ca-rts-cts/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `wifi` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `hidden-node` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **Wi-Fi avoids collisions it can't detect; RTS/CTS fixes the hidden node**.

The student: step stations with and without RTS/CTS.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/hidden-node/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` (Uvod u računalne mreže), first section "Što treba znati": why 802.11 cannot use CSMA/CD, CSMA/CA and DCF, skriveni čvor, RTS/CTS with the Duration field and NAV, RTS_Threshold, ACK for every unicast frame and retransmission after a random backoff; Primjer 1 "skriveni čvor u velikoj učionici" (A, B = AP, C)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch17-skriveni-cvor-rts-cts.svg` (the book's figure of Primjer 1)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skriveni-cvor.html` (the existing page, adopted as `hidden-node`: RTS/CTS on/off toggle over Primjer 1)
- W. Diepstraten, P. Belanger, *802.11 Tutorial: 802.11 MAC Entity*, IEEE P802.11-96/49C (the book's cited source, slides 4–9)
- IEEE Std 802.11-2020, clause 10.3 "DCF" (DIFS, SIFS, backoff counter frozen while busy, CW doubling CWmin → CWmax, virtual carrier sense via NAV) *(check: no local copy; values CWmin 15, CWmax 1023 for OFDM PHYs from textbooks, e.g. Kurose & Ross §7.3.2)*
- Catalogue seed: extends urm-hidden-node

## Model and presets

- **Scene:** the book's Primjer 1 line-up: station A on the left, access point B in the middle, station C on
  the right, with range circles showing that A and C each hear B but not each other (dashed "out of range"
  between A and C). Under it a **slot timeline** with one row per party (A, B, C) and a NAV bar per
  station. Reuses the hidden-node page's topology (from `sims/hidden-node/`), copied per COMMON.md §6.
- **State:** `{ t, medium: {A, B, C} /* what each party hears: idle|busy|garbled */, stations: [{ id,
  phase, backoff, cw, nav, retries, delivered }], frames: [{ kind: 'RTS'|'CTS'|'DATA'|'ACK', from, to,
  start, end, duration, ok }], log }`. Backoff draws are scripted per preset (or seeded), so every run replays.
- **One step:** one event, not one microsecond: "DIFS idle ends", "backoff counts down to 0", "X sends
  RTS/DATA", "B answers CTS/ACK after SIFS", "NAV set", "timeout, no ACK". Within a step: (1) parties whose
  timer reaches 0 transmit; (2) each receiver resolves what it hears (one frame in range = ok, two = garbled
  at that receiver); (3) every station that decoded a frame not addressed to it sets NAV = Duration;
  (4) timers that are not frozen count down; (5) caption.
- **Rules:**
  1. A station cannot detect a collision while it transmits, so 802.11 avoids collisions instead (URM ch17
     "Što treba znati", first paragraph).
  2. Before sending, a station waits for the medium to be idle for DIFS, then counts a random backoff of
     0 … CW slots; the counter decrements only while the medium is idle and freezes while it is busy, resuming
     where it stopped (IEEE 802.11-2020 10.3 *(check)*; random backoff in URM ch17 [^ack]).
  3. Carrier sense is local: a station counts the medium busy only if **it** hears a transmission or its NAV
     is non-zero (virtual carrier sense) (URM ch17 NAV paragraph).
  4. Every unicast data frame is answered by ACK after SIFS; no ACK by the timeout means "lost", and the
     sender doubles CW (CWmin 15 → 31 → 63 … up to CWmax 1023) and retries (URM ch17 ACK paragraph; numbers
     IEEE 802.11 *(check)*).
  5. Hidden node: if A's and C's transmissions overlap at B, B hears garbage and sends no ACK; neither A nor C
     noticed anything while sending (URM ch17 Primjer 1).
  6. RTS/CTS: the sender sends a short RTS, the receiver answers CTS after SIFS; both carry a Duration field
     covering the rest of the exchange (CTS + DATA + ACK); every other station that hears **either** sets
     its NAV and stays silent until it expires. C hears B's CTS even though it never hears A (URM ch17,
     Primjer 1 solution).
  7. RTS is used only for frames larger than RTS_Threshold; smaller frames go without it (URM ch17
     RTS_Threshold sentence).
  8. Tie-break: two stations whose backoff reaches 0 in the same slot both transmit; with RTS/CTS on, the
     collision is between two short RTS frames (no CTS comes back, both double CW), which wastes far less
     airtime than two colliding data frames (derived from rules 4 and 6, *(check)* wording against 802.11).
  9. Edge case: a station that hears neither RTS nor CTS (out of range of both A and B) does not defer; not in
     this line-up, mentioned in the explanation only.
- **Params:** `rtscts` toggle (default from preset); `dataSlots` range 2–6 (length of the data frame,
  default 4); `threshold` range 0–6 (RTS_Threshold in the same units, default 0 = always RTS); `hidden`
  toggle (A and C out of each other's range, default on); `seed` range 1–99 (default 3).
- **Presets:**
  1. `hidden-no-rts` — URM ch17 Primjer 1 without RTS/CTS: A and C both draw backoff 2, both send DATA to B,
     garbled at B, no ACK, both time out and double CW to 31. From URM ch17 Primjer 1 (outcome); backoff
     values derived.
  2. `hidden-rts` — the same with RTS/CTS: A sends RTS, B answers CTS, C hears the CTS and sets NAV for
     CTS+DATA+ACK, A's data and B's ACK succeed; C sends after NAV expires and its own DIFS/backoff. From URM
     ch17 Primjer 1 (solution).
  3. `not-hidden` — A and C hear each other; backoff A=3, C=5: A wins, C freezes at 2 while A's frame is on
     the air, then resumes and sends after 2 more idle slots. No RTS needed. Derived, unchecked.
  4. `rts-collision` — hidden, RTS/CTS on, both draw the same backoff: two RTS frames collide at B, no CTS,
     both retry with CW 31; draws A=4, C=9 → A's exchange completes, C waits on NAV. Rule 8. Derived, unchecked.
  5. `threshold` — RTS_Threshold = 3: a 2-slot frame from A goes without RTS, a 5-slot frame from C uses
     RTS/CTS. Rule 7. Derived, unchecked.
- **Steps:** about 7 (`hidden-no-rts`), 12 (`hidden-rts`), 9 (`not-hidden`), 14 (`rts-collision`),
  10 (`threshold`). Derived; fix after the model exists.
- **Legend:** A, B, C in c1/c2/c3 with letters; RTS, CTS, DATA, ACK as labelled bars (DATA long, others
  short); garbled reception hatched with an X; NAV as a dotted bar on the station's row; backoff counter as a
  number in the station badge; "changed" marks the frame just sent and any NAV or counter that changed.
- **Captions:**
  - hr: "C ne čuje A, ali čuje *CTS* od B. Polje trajanja kaže 6 odsječaka, pa C postavlja *NAV* (virtualni
    osjetnik zauzeća medija) i šuti."
  - en: "A and C both reached zero in the same slot. Their data frames overlap at B, which hears only noise
    and sends no ACK. Neither A nor C noticed anything."
- **Terms:** hidden node — skriveni čvor; collision avoidance — izbjegavanje kolizije; access point — *access
  point* (pristupna točka); Network Allocation Vector — virtualni osjetnik zauzeća medija (NAV); acknowledgement
  — potvrda primitka (ACK); Request to Send / Clear to Send — RTS / CTS; random backoff — slučajno čekanje.
- **Misconceptions:** C defers because it hears A (it hears only B's CTS); RTS/CTS prevents all collisions
  (RTS frames can still collide, they are just cheap); Wi-Fi detects collisions like Ethernet (it infers loss
  from a missing ACK).
- **Out of scope:** exact µs timings per PHY, EDCA/QoS access categories, CTS-to-self, fragmentation, rate
  adaptation, exposed-node problem.
- **Builds on `hidden-node`:** reuses its three-node line-up and the "RTS/CTS on/off" outcome; new are the
  DCF timeline (DIFS, backoff freezing, CW doubling), the NAV bars and the RTS_Threshold.

**Note for the coordinator:** the adopted `hidden-node` page (URM `skriveni-cvor.html`) already toggles
RTS/CTS over the same Primjer 1, so presets 1–2 duplicate it. This page earns its place only through the DCF
backoff and NAV timeline (presets 3–5). Either make `hidden-node` a link to this page's first two presets once
it exists, or narrow this task to "CSMA/CA backoff" and leave RTS/CTS to `hidden-node`. Source line "No local
course material" was wrong: URM ch17 covers it.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh csma-ca-rts-cts sims/csma-ca-rts-cts` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/csma-ca-rts-cts/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
