<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# line-coding: specification

One concept: **how bits become a signal and why the clock must be recoverable.** An explorer (no steps): the bit
string, the receiver's clock drift and two view options drive everything; the state is a pure function of the params.

Task: `docs/tasks/w3/line-coding.md`; catalogue `net-line-coding` (§4.1). Numbers below were checked with a script
(an independent round-half-down formula against the model's sampling, and a brute force over every string of up to
12 bits at every drift −20…+20 %); the same numbers are asserted in `sim.test.js`.

## Time axis

Cell i spans [i, i + 1] in units of one bit cell (*bit cell*, bitna ćelija) T. Waveform times are multiples of ½.
The signal starts at t = 0 on the first cell's level; there is no transition at t = 0 and none after the last cell.

## Rules

1. **NRZ-L.** The level is constant for the whole cell: 1 = high, 0 = low. Equal neighbouring bits produce no
   transition; different ones produce one at their common boundary. *(check: textbook convention, Forouzan
   "Line coding", Stallings "Digital data, digital signals"; some texts, polar NRZ-L among them, put 0 high. The
   choice does not change anything about the clock.)*
2. **Manchester.** Every cell has a transition exactly in its middle: low → high = 1, high → low = 0, so a 1 is
   low then high and a 0 is high then low. Source: IEEE 802.3 clause 7.3.1.1 / clause 14 as quoted in URM
   `06-fizicki-sloj.md`, "Kako signal nosi bitove", footnote `ieee-manchester` (UNH-IOL: "Voltage High -> Voltage Low
   = Logic 0; Voltage Low -> Voltage High = Logic 1").
3. **Boundary jump.** Two neighbouring equal bits: the first ends on the level the second must start from the other
   side of, so the signal jumps back at their common boundary. That jump is not a bit. Different neighbours: no
   jump (a 1 ends high and a 0 starts high; a 0 ends low and a 1 starts low). Source: URM ch06, the `1 0 0 1`
   walk-through.
4. **The Manchester receiver reads the direction of the mid-cell transition, not the level** (URM ch06; Pitanja 3).
5. **NRZ clock recovery (derived).** The receiver knows where the string starts (a preamble stands in for that,
   one sentence on the page) and re-aligns its clock on every transition. Its own cell is T·(1 + d), d = drift. In a
   constant run of k cells starting at a it samples at a + (j + ½)·(1 + d), j = 0, 1, …, and reads the run's level
   at each instant. The number of samples in the run equals round(k / (1 + d)) except at exact halves (tie-break
   below). With d = +10 % a run of 6 or more equal bits loses a bit (k / 1.1 < k − ½ ⇔ k > 5.5); with d = −10 % a run
   of 5 or more gains one (k / 0.9 > k + ½ ⇔ k > 4.5). The first failing run length per drift:

   | d | −20…−15 | −14…−12 | −11, −10 | −9, −8 | −7 | −6 | −5 | −4 | −3…+3 | +4 | +5 | +6 | +7 | +8, +9 | +10, +11 | +12…+14 | +15…+19 | +20 |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | k | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 13 | none ≤ 16 | 13 | 11 | 9 | 8 | 7 | 6 | 5 | 4 | 3 |

   A cell of the run with no sampling instant in it is **lost** (d > 0); a cell with two is **extra** (d < 0). With
   |d| ≤ 20 % the spacing (0.8…1.2 cells) never puts two instants in a cell when d > 0, or leaves a cell empty when
   d < 0, so a run is either all-lost or all-extra.
6. **Manchester clock recovery (derived).** After a mid-cell transition the receiver ignores transitions for ¾ of
   its own cell, ¾·(1 + d); the first mid-cell transition is expected half a cell after the known start. The next
   transition after that window is the next mid-cell one, read by its direction, and it re-aligns there. A boundary
   jump comes ½ cell after a mid-cell transition, the next mid-cell transition 1 cell after, so decoding is correct
   for ½ < ¾·(1 + d) < 1, i.e. **|d| < ⅓**. Within the slider's ±20 % every string is read correctly (checked over all
   strings of up to 12 bits). *Deviation:* the task says |d| < 50 % "derived from rule 2"; with a ¾-cell window the
   bound is ⅓ (at d = ±34 % the model misreads: at +34 % `0011` loses cells 1 and 4 and reads cell 2 wrong, at
   −34 % `0000` reads a boundary jump as an extra bit in cells 2–4). The page never leaves ±20 %, so nothing shown changes.
7. **Cost.** Manchester has one or two transitions per bit, NRZ at most one; a counter per lane shows them, with
   Manchester's split into mid-cell and boundary. Manchester's shortest signal element is half a cell, so 10 Mb/s
   Manchester (10BASE-T) runs at 20 Mbaud (signal elements, not transitions: `10101010` has only 8 transitions for 8
   bits) *(check: IEEE 802.3 clause 14)*; in the explanation only.
8. **Edge cases.** An all-zero or all-one string is a single NRZ run with no transitions: the lane says "no
   transitions" and the caption says that without a preamble the receiver could not even find the first cell
   boundary. The string has 1–16 bits; "+" adds a 0 at the end, "−" removes the last bit, both refuse at the limit.

### Tie-breaks

- **A sampling instant exactly on the run's end** belongs to the next run, which re-aligns there (strict "<"). So
  ties of k / (1 + d) at an exact half round **down**: a run of 3 at +20 % is read as 2 (instants 0.6, 1.8, 3.0), a
  run of 2 at −20 % as 2 (0.4, 1.2, 2.0). The task's round(k / (1 + d)) leaves this open (JavaScript's `Math.round`
  would give 3 and 3). All ties in range: d = −20 (k = 2, 6, 10, 14), −12 (11), −4 (12), +4 (13), +12 (14),
  +20 (3, 9, 15).
- **An instant exactly on a cell boundary inside a run** falls in the later cell (floor). Example: d = +20 %, the
  third instant of a run is at 3.0.
- **Integer arithmetic.** Instants are computed in 1/200 cell, (2j + 1)·(100 + d), so the ties above are exact.
- **Manchester window** at ¾·(1 + d) has no tie for integer d (¾·(1 + d) is never ½ or 1 within ±20 %).
- **Pattern vs own bits.** `pattern` other than `own` wins over `code`; editing a cell sets `pattern: 'own'` and
  writes `code`.

## Params

| Param | Type | Values | Default |
|---|---|---|---|
| `pattern` | select | `own`, `1001`, `1101`, `10101010`, `0000000011111111`, `1111111111111111` | `own` |
| `code` | hidden range | the bit string with a leading 1 (`'1001'` → 25), 2…131071 | 25 |
| `drift` | range | −20…+20 %, step 1 | 0 |
| `showClock` | toggle | the sender's clock under the lanes | off |
| `lanes` | choice | `both`, `nrz`, `manchester` | `both` |

`code` replaces the task's string `bits`: the kit's params are numbers, booleans and options, and a hidden range
keeps the edited string in the URL and across the language switch.

## State

`{ bits, n, drift, nrz: [{level, from, to}], man: [{level, from, to}], edges: { nrz: [{t, dir, kind}], man: [...] },
transitions: { nrz, man, manMid, manBoundary }, samples: { nrz: [{t, bit, cell}], man: [...] }, readNrz: [bit],
readMan: [bit], errors: { nrz: [{cell, kind}], man: [{cell, kind}] }, runs: [{bit, from, len}], longestRun,
noTransitions }`. `errors` carries a kind (`lost`, `extra`, `wrong`) per cell instead of the task's bare indices.

## Presets and expected numbers

| # | id | bits | drift | NRZ transitions | Manchester (mid + boundary) | NRZ reads | Manchester reads | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | `book-1001` | 1001 | 0 | 2 | 5 (4 + 1, at t = 2) | 4/4 | 4/4 | URM ch06 "Kako signal nosi bitove" |
| 2 | `book-1101` | 1101 | 0 | 2 | 5 (4 + 1, at t = 1) | 4/4 | 4/4 | URM ch06 Pitanja 4 |
| 3 | `long-run` | 0000000011111111 | +10 % | 1 | 30 (16 + 14) | 14 bits; cells 5 and 13 lost | 16/16 | derived |
| 4 | `alternating` | 10101010 | +10 % | 7 | 8 (8 + 0) | 8/8 | 8/8 | derived |
| 5 | `all-ones` | 1111111111111111 | 0 | 0 (no transitions) | 31 (16 + 15) | 16 (start known) | 16/16 | derived |

`all-ones` turns the sender's clock on, so the flat NRZ line can be compared with the 16 clock periods under it
(*deviation:* the task sets only drift 0 for it).
`long-run`: each 8-cell run is sampled at 0.55, 1.65, 2.75, 3.85, 4.95, 6.05, 7.15 cells from its start, so the
sixth cell of each run (cells 5 and 13) has no instant.

## Legend and marks

NRZ waveform (c1, solid), Manchester waveform (c2, solid), boundary jump (c2, dashed vertical), mid-cell transition
(▲ / ▼ arrowhead), receiver's sampling instant (hollow ring on the NRZ lane, at the level read), mid-cell instant (short muted tick at the foot of the time column), misread bit (danger + ✕ for lost, +1 for
extra), sender clock (muted), changed (highlight + outline on the clicked cell and the transitions it added or
removed).

## Out of scope

4B/5B, 8B/10B, 64B/66B, MLT-3, PAM (named in the explanation only); differential Manchester; analogue noise,
attenuation, eye diagrams; framing and preamble beyond one sentence.
