<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# crc-error-detection: notes

New stepper (task `docs/tasks/w3/crc-error-detection.md`, catalogue `net-crc`, wave 3). Rules and expected numbers:
`SPEC.md`. Drawn by the page: the kit has no bit strip view (the task's "§7.2" does not exist in `docs/sim-ui.md`);
see Shared requests.

## Decisions

- **One run, sender then receiver.** Every preset is one story: the sender's division row by row, the FCS, and,
  only when the error pattern is non-zero, the line, the parity check and the CRC check. The check presets open at
  the `sent` step, so a lecturer gets to the comparison in three presses and can still go back through the division.
- **One step = one XOR row; leading zeros write no row.** The task's own count for `crc-build` (5 division rows +
  start = 6 steps) only works if a leading 0 is brought down without a row of its own, so that is the rule (SPEC
  rule 7); the caption says how many zeros were brought down before each row.
- **The receiver's division is one step**, all rows at once (the task: "one step divides the received codeword and
  reads the remainder"). The burst preset's receiver division has 9 rows; row by row it would double the demo.
- **Errors hit message bits only, in both frames alike.** The parity frame (message + P) and the CRC frame
  (message + FCS) have different check bits, so "the same error on both" is only exact on the message bits. P and
  the FCS arrive intact; the explanation still says what the CRC guarantees anywhere in the codeword, and the tests
  check rules 5 and 6 over the whole codeword.
- **The message is fixed at 10 bits** (the task's default `1101011111` and every preset); a length param would add
  nothing to the concept. Editing is by clicking bits on the stage, or the "Message" slider.
- **`data` and `flip` are kit range params** (0 … 1023, shown as bit strings), so they stay in the URL and survive
  the language switch. They were hidden first, but the gate's slider check clicks the first range slider and failed
  on a hidden one (Shared requests); visible, the "Error pattern" slider also names rule 6's error pattern.
- **No `mode` param.** The scene shows parity and CRC side by side at every step, as the task's scene asks, so a
  parity/crc mode would do nothing. `hamming` belongs to the `fec-hamming` preset task, which has no model here yet
  (see "For fec-hamming").
- **Verdicts** are the receiver's answer plus what the simulator knows: ✓ accepted (nothing flipped), ⚑ detected,
  ✕ missed (accepted although bits flipped). Symbol, word and border style differ, so they survive grayscale.
- **Two buttons:** "Random message" (N, seeded `Simdeck.rng`) and "No errors" (X).

## Deviations from the task

- Step counts: `crc-build` 6 as the task says; the three check presets have 9 steps each (5 rows + sent + line +
  parity + CRC), not 8 / 7 / 8. The task gives no breakdown that yields those counts.
- State shape: `{ phase, data, gen, r, parity, dividend, rows, fcs, codeword, planned, flipped, received,
  receivedParity, parityCheck: { ones, verdict }, crcCheck: { rows, remainder, verdict } }` instead of the task's
  `mode`, `step`, `division`, `syndrome`, `verdict`. Same content; one verdict per scheme because both are shown.
- Preset 5 `fec-hamming` is not here: it is added by the `ham-fec-hamming` task.
- Params: `mode` dropped (above); `flip` is a mask param (the task: "click bits, no fixed count"), with a slider too.

## Sources

- 50ohm `contents/sections/fehlererkennung.md` (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.):
  even/odd parity, one flip caught, two missed, three caught; CRC for variable-length data. Rewritten, not copied;
  credited in the explanation (both languages) and in `sim.json` `credits`.
- URM ch07 "Građa Ethernet okvira i MAC adresa" (`~/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`):
  FCS = *provjera ispravnosti okvira*, 4 octets, at the end of the frame; the term pair is from there.
- W. W. Peterson, D. T. Brown, "Cyclic Codes for Error Detection", Proc. IRE 49 (1961): modulo-2 division, burst
  guarantee *(check: cited from textbooks, no local copy)*.
- The worked example (`1101011111` ÷ `10011` → `0010`) is the task's; the numbers were checked by script.

## Checks

- Numbers: an independent Python script (long division over GF(2) on lists) gave FCS `0010` in 5 rows, burst
  remainder `0011`, single-bit (bit 3) `0111`, blind spot (bits 2, 5, 6) `0000`, CRC-3 `011`, CRC-8 `10100101`
  before the model was written; the model agrees (`sim.test.js`, presets).
- Rule tests broken on purpose, first 20 mutations one at a time (odd parity, XOR on a leading 0, skip position 0, stop one
  short, OR for XOR, no zeros appended, r + 1 zeros, wrong remainder slice, accept on the first bit only, parity
  accepts odd, `missed` folded into `ok`, flip list reversed, check steps without errors, FCS shown early, flips
  shown before the line, P flipped, an FCS bit flipped, all rows at once, duplicate flip indices counted twice,
  FCS before the message): every one fails a test.
- Page sweep (Playwright, unbuilt from `file://`, 1920×1080): every step of 3 generators × 10 messages × 8 error
  patterns in both languages, 4300 states: no console errors or warnings, no page scroll, nothing outside the
  stage, no caption with a placeholder or `undefined`.
- `npm run gate -- crc-error-detection`: passes; screenshots reviewed at 1920×1080 light, dark, grayscale and
  375×812 in both languages, plus `crc-build` step 3, the end of each check preset, CRC-8 with every bit flipped,
  and the all-zero message.

- Fresh review (a separate agent recomputed every number in Python, mutated the model, and drove all four presets
  in both languages): numbers, plurals, clicks and → after a click confirmed. Fixed from it: six mutations that
  survived now have tests (P hard-coded to 0, the receiver counting without P, the receiver dividing by CRC-4
  whatever the choice, the receiver's grid showing the sender's rows, a mask of 1 getting no receiver steps, the
  codeword shown before it is sent): 26 mutations in all, none survive. The English summary read as "a CRC [misses]
  the burst"; the burst guarantee now names the +1 term it needs (SPEC rule 5: "more than one term" is not enough);
  a single flip says "at position"; the legend's highlight is "new in this step" (it also marks the remainder and
  the verdict). Left as is: with CRC-8 at the end the remainder and verdict wrap under the frame name (readable).

## Unchecked *(check)*

- Peterson & Brown's burst guarantee is cited from textbooks; rules 5 and 6 are verified by exhaustive tests for
  CRC-4 on the default codeword, not from the paper.
- CRC-8 here is x⁸ + x² + x + 1 (`100000111`, the task's choice); the page names it only "CRC-8".
- Ethernet's FCS is CRC-32 and a frame failing it is silently dropped (the explanation says both; URM ch07 gives
  only "4 okteta" and says "dropped" only of runts; the task cites URM for it). IEEE 802.3, no local copy.
- The task calls 50ohm CC BY-SA; the repo's LICENSE and README say CC BY 4.0, which the credit uses.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| error detection | otkrivanje pogrešaka | 50ohm `fehlererkennung.md` |
| parity bit | paritetni bit | 50ohm `fehlererkennung.md` |
| even / odd parity | parni / neparni paritet | 50ohm `fehlererkennung.md` |
| cyclic redundancy check | ciklička provjera redundancije | 50ohm `fehlererkennung.md` |
| generator polynomial | generatorski polinom | task *(check)* |
| frame check sequence | provjera ispravnosti okvira | URM ch07 |
| burst error | rafalna pogreška | task *(check)* |
| remainder | ostatak | task |

`parity` (paritet) is in the glossary and used as `[[parity]]`.

## Shared requests

- **A bit strip kit view** (the task names "the kit's bit/field strip view (§7.2)"; none exists). This page draws
  its own: a row of bit cells with a kind (data / check / ghost), a gap before the check bits, a flip mark (✕ and
  hatching), click-to-toggle with a label per bit, and a long-division grid (dividend, ⊕ generator under its window,
  the register left, the remainder outlined). Hamming, parity and checksum sims could share both.
- **The gate's slider check assumes the first range slider is visible** (`kit/tools/check-page.mjs`: it clicks
  `[data-sd-controls] input[type="range"]` first match and reads its box, which is null when the control is hidden
  with `visible: () => false`; the browser check then crashes). It could pick the first visible slider.
- **Kit legend swatches** `data`, `check` (double border) and `flip` (hatched with ✕): defined in the page's CSS.

## For fec-hamming (the preset task that adds preset 5 here)

The host has no Hamming model and no `mode` param: that task will need a model function (Hamming(15,11) or (7,4)
encode, syndrome, correction) and a way to show it, which is more than "presets, their strings and tests only"
(COMMON.md §6). Its task file asks the host for a `code` choice (parity / CRC / hamming15) and an 11-bit `data`
select; here the message is fixed at 10 bits and there is no `code` param. Its own instructions say to write the
change under "Shared requests" here and stop, and its coordinator note suggests a second mode of the page. Raised in
the report.

## Time

Start 2026-10-25 11:08, first gate pass 11:22, review fixes and status ready 11:32: about 25 min of build and review.
