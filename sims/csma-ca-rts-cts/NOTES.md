<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# csma-ca-rts-cts: notes

Task `docs/tasks/w3/csma-ca-rts-cts.md`, catalogue `net-csma-ca-rts-cts` (extends `urm-hidden-node`). Rules, numbers
and presets: `SPEC.md`. A new native stepper; builds on `sims/hidden-node`.

## Decisions

- **One step = one event, not one slot**, as the task asks. The model runs the whole exchange slot by slot
  (`simulate`), and the steps are its key slots: slot 1 (DIFS), a frame start, a reply, a timeout, and the DIFS
  after which a frozen counter resumes. Countdown slots fold into the next key step; the caption lists their
  events. `steps` is a function of the params (8 for the defaults, which is `sim.json`'s count); a run stops when
  both frames are delivered, after 48 slots, or at 20 steps.
- **The timeline shows the whole run's slots** (its length is known from the start), with future slots dotted.
  The current step's slots are underlined on the ruler.
- **Line-up and reception from hidden-node:** the same A — B — C, the same "intact only if heard alone in every
  slot" rule, and NAV through the ACK. `hears()`, `newFrame()` and the reception step are adapted from
  `sims/hidden-node/sim.js @ 84afa5d` (comment in `sim.js`). New: DIFS, the backoff counter that freezes and
  resumes after a new DIFS, CW doubling, the Duration field as a number, RTS_Threshold, and per-station frame sizes.
- **Simplified timing** (SPEC.md "Units"): 1-slot RTS/CTS/ACK, SIFS as the slot boundary, DIFS one slot, the
  timeout in the slot after the frame. No EIFS. NAV only from RTS/CTS (the book's text); DATA's Duration (for the
  ACK) is left out because the ACK itself is heard by everyone in range of B.
- **Presets 1 and 4 share their draws** (A 2, C 2 and seed 5, so retries A 2, C 7), so "no RTS/CTS" and "RTS
  collision" compare like with like: 4 slots of noise at B vs 1.
- **Preset hints ask, never answer** (no answer keys on pages).
- **Panel fit:** 8 controls did not fit at 1920×1080 (1337 px for 926). The controls lost their hints (their
  meaning moved into the explanation's last paragraph), and the sliders sit in pairs in a two-column grid
  (threshold | seed, A | C), as `sims/ceph-down-out` does. `.sd-ctl[hidden] { display: none }` is the same
  workaround `sims/amdahl` uses: kit.css's `display: flex` beats the `hidden` that `visible()` sets
  (see "Shared requests").
- **Colour is not the only carrier:** A's frames solid, C's solid and hatched, B's replies round and tinted; noise at
  B is red with a cross-hatch and ✕; a lost frame has a dashed red outline and ✕; NAV is a dotted bar with the word
  NAV; DIFS a dashed cell with the word; a frozen counter a double border and ‖. Checked in the grayscale screenshot.
- **Term rule:** the glossary has none of these terms, so `strings.js` writes them out and the page does not load
  `glossary.js`. *access point* stays English in italics on Croatian pages, as in the book and hidden-node.

## Deviations from the task

- `dataSlots` became two params, `dataA` and `dataC`: the `threshold` preset needs a 2-slot frame from A and a
  5-slot one from C.
- The first backoff draws are params (`backoffA`, `backoffC`, 0–15); `seed` (1–99) draws only the retries. The task
  has only `seed`; with it alone no preset could fix "A and C draw the same number".
- `seed` defaults to 5, not 3: seed 5 gives the retry draws (A 2, C 7) that tell presets 1 and 4 cleanly.
- `rts-collision` retry draws are A 2, C 7 (task: A 4, C 9, "derived, unchecked"): same story, A first, C on NAV.
- Step counts 8, 10, 6, 12, 8 (task estimates 7, 12, 9, 14, 10, "fix after the model exists").
- The task's hr caption example says "6 odsječaka" for the CTS's Duration field; with a 4-slot DATA the CTS covers
  DATA + ACK = 5 slots (the RTS covers 6). The page computes it.
- The task's term "virtualni osjetnik zauzeća medija (NAV)" is used in the explanation and in the hidden-NAV
  caption.

## Sources

- URM book ch. 17 (`uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`), "Dijeljeni medij", "Što treba
  znati": no collision detection while sending, CSMA/CA and DCF, the hidden node, RTS/CTS with Duration and NAV,
  RTS_Threshold, ACK for every unicast frame and retransmission after a random backoff (footnotes quoting IEEE
  P802.11-96/49C slides 4, 6, 8–9). Primjer 1 (A, B, C; outcome and solution).
- Figure `assets/diagrams/ch17-skriveni-cvor-rts-cts.svg` (not copied; the line-up follows it).
- `sims/hidden-node/` (model and stage).
- *(check)* IEEE Std 802.11-2020 §10.3 (DCF): DIFS, SIFS, backoff frozen while busy, CW doubling, NAV. No local copy.
- *(check)* CWmin 15 and CWmax 1023 for OFDM PHYs: textbook values (Kurose & Ross §7.3.2), not checked against the
  standard.
- *(check)* Rule 8's wording (two RTS frames collide, cheaper than two DATA frames): derived from rules 4 and 6.

## Unchecked

- The items marked *(check)* above.
- Slot, DIFS and SIFS lengths are simdeck's simplification (SPEC.md "Units"), not 802.11 values.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| hidden node | skriveni čvor (ch. 17) |
| collision avoidance | izbjegavanje kolizije (ch. 17) |
| access point | *access point* (ch. 17 keeps the English term) |
| acknowledgement (ACK) | potvrda primitka (ACK) (ch. 17) |
| Network Allocation Vector (NAV) | virtualni osjetnik zauzeća medija (NAV) (ch. 17) |
| random backoff | slučajno čekanje (ch. 17) |
| duration field | polje trajanja (ch. 17) |
| station | stanica (ch. 17) |
| slot | odsječak (simdeck's, as in hidden-node; the book has no term) *(check)* |
| contention window (CW) | CW, not translated (the book does not name it) *(check)* |
| counter (backoff counter) | brojač (simdeck's) |

## Shared requests

- **models/:** `sims/hidden-node` and this sim share the line-up, `hears()` and the reception rule. If a third Wi-Fi
  sim comes, promote `simulate` from this `sim.js` (pure, no strings) as `models/wifi-dcf.js`; it covers hidden-node's
  cases with RTS/CTS on/off and fixed draws.
- **kit:** `.sd-ctl` has `display: flex` in kit.css, which overrides the `hidden` attribute a param's `visible()`
  sets, so a hidden control still shows. Smallest fix: `.sd-ctl[hidden] { display: none; }` in kit.css. `amdahl`,
  `ceph-down-out` and this page work around it locally.
- **glossary:** the term pairs above, with `"src": "simdeck"`.

## Review

A fresh reviewer (a subagent with no context from the build) read the code against SPEC.md, re-derived the five
presets slot by slot (all matched) and ran about 60 mutants. Found and fixed:

- The "C does not hear A and keeps counting" caption also fired while C was held by NAV (hidden-rts step 4,
  rts-collision slot 11), contradicting the preset's point. `unheard` is now emitted only when the station counts
  down or passes DIFS in that slot; a test pins it.
- A tie with different kinds (DATA from A, RTS from C under a threshold) was captioned with one kind: the caption
  now names both.
- Slot 1 with a counter of 0 said "both start counting": now one sentence per case (both, one, counter 0 sends
  right after DIFS); the quiet fallback no longer claims counting.
- Station status for the phases "counter at 0, sends next" and "got the CTS, sends DATA" had wrong labels.
- A run cut at the step limit would have been reported finished: `finished` now also needs the last slot
  (unreachable today: the most steps any params give is 17).
- SPEC's 1-vs-4 slot accounting was wrong; corrected.
- Surviving mutants killed with new tests: the intact-frame rule checked in one slot only (partial overlap test,
  `backoffC` 4), NAV computed from the wrong frame size (unequal sizes), the threshold boundary inside a run, the
  first folded slot's events dropped, the slot limit. My own mutation run (`r1`…`r8` plus those) kills all but one
  equivalent mutant (the `finished` guard above).
- No content errors found (NAV source and coverage, CW doubling, freeze and resume, threshold semantics).

## Time

Start 16:31, done 16:55 (2026-11-08).
