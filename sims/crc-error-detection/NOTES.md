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
  parity/crc mode would do nothing. Hamming, added by the `fec-hamming` preset task, is the fourth option of the
  generator choice (below).
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

Resolved by that task (section "Preset task `fec-hamming`" below): the Hamming run is the code choice's fourth option.

## Time

Start 2026-10-25 11:08, first gate pass 11:22, review fixes and status ready 11:32: about 25 min of build and review.

## Preset task `fec-hamming` (Hamming code)

Task `docs/tasks/w3/fec-hamming.md`, thread t-0366, catalogue `ham-fec-hamming` (§4.10, §5.13). Four presets
(`hamming-k`, `hamming-a`, `hamming-p1`, `hamming-two`), rules and numbers in `SPEC.md` "Hamming(15,11)"; entry
`hamming-k` in `sim.json`.

### Decisions

- **The host model could not express it, so it was extended additively**, as the `fencing` and `win-failover-cluster`
  preset tasks did on `quorum-split-brain`, and as SPEC-NOTES (batch 10) asks: "if the host can't add it, make
  Hamming a second mode of that page". New pure functions in `sim.js` (`covers`, `hammingEncode`, `hammingChecks`,
  `syndromeOf`, `hammingCorrect`, `hammingDecode`, `hflipList`, `hmaskOf`; promotable unchanged), a `hammingState`
  run, two params (`hdata`, `hflip`), and a second scene drawn by `hamming()` in the page. The CRC run, its params,
  presets 1–4 and their URLs are unchanged (tested: the Hamming params do not touch a CRC state).
- **The code choice is the generator choice with a fourth option, `gen = hamming15`**, not a separate `code` param
  (the task's name). The panel at 1920×1080 was already exactly full (926 px of 926): one more control made it scroll.
  The choice's label became "Kod" / "Code" and its hint names both codes; `state.code = 'hamming15'` is set as the
  task's state asks.
- **Each mode shows its own presets and legend items** (CSS on `html[data-ce-mode]`, as `quorum-split-brain` does):
  eight presets do not fit either. Keys 1–8 load any preset from either mode, and the help overlay lists all eight.
- **13 steps for every word and error pattern** (the task's list), with step 0 before the data are placed. With no
  error the checks all pass, the syndrome is 0 and the verdict is ✓. `hamming-k` opens at step 0 and walks through
  the encoding; the other three open at the sent word (step 6), like the CRC check presets, so a lecturer reaches the
  error in one press. All four use the same data, so the encoding is the same.
- **Legend:** parity bit (square with a double border, "p"), data bit (circle, "a"), flipped on the line (hatched,
  ⚡), syndrome (↓), new in this step. Pass ✓ and fail ✕ are written out in their chips on the stage ("✓ passes",
  "✕ fails"), so they are not in the legend: with them the header wrapped to two lines and pushed the panel into
  scrolling.
- **The check rows read the sent word before the line and the received word after it.** The band of the current
  check is highlighted, and so is p_j's bit in every covered position's binary index.
- **Verdicts:** ✓ "no error" (nothing flipped), ↺ "corrected" (double border), ✕ "wrong data" (dashed). After the
  correction, bits that still differ from the sent word are marked with ⚡ in the corrected word and the decoded data.
- **Phone:** the 15 columns need about 26 cells of width; under 900 px the grid keeps 2.6 rem cells and scrolls
  sideways inside the stage (the page itself does not scroll sideways).
- **Kit `[hidden]` on controls:** the kit sets `hidden` on a control whose `visible()` is false, but `.sd-ctl`'s
  `display: flex` wins over it; the page adds `.sd-ctl[hidden] { display: none; }` as `amdahl`, `cgnat` and others do.
  This also fixes the old note above (a hidden slider crashing the gate's slider check): the first slider in CRC
  mode is the visible message slider.

### Deviations from the task

- Param `code` is `gen = hamming15` (above). Params `hdata` (a range over every 11-bit word, shown as bits, plus
  clicking data bits) instead of a select of a few words, and `hflip` (a 15-bit mask, plus clicking received bits).
- State: `{ code, phase, j, data, word, planned, flipped, received, checks: [{ ones, result: pass|fail } | null ×4],
  syndrome, corrected, fixed, decoded, wrong, dataWrong, verdict }`; `data` is a bit array, not the string.
- Pass/fail are not legend items (above). Captions follow the task's example (step 12 of `hamming-a`) word for word.
- More than "presets, their strings and tests": model, params, scene and explanation in the host, because the host had
  no Hamming model (its NOTES said so).
- The host's `sim.json` gets an entry, four Hamming aliases each, and a second 50ohm credit (the error correction
  section). Its title and concept stay CRC-only.

### Sources

- 50ohm `contents/sections/fehlerkorrektur.md` (FEC; the in-depth box with the 11-bit Hamming example, positions a–k,
  p1–p4 in crossword areas, errors in k, a and p1; more than one error not correctable) and `fehlererkennung.md`
  (even parity) (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.). Rewritten, not copied; credited in
  the explanation (both languages) and in `sim.json` `credits`. The figures `hamming1` … `hamming6` are not in the
  repo, so the data bits are the task's own (`10110011101`).
- R. W. Hamming, "Error Detecting and Error Correcting Codes", Bell System Technical Journal 29(2), 1950: the
  syndrome as the binary position *(check: no local copy; the rules are standard and tested exhaustively)*.

### Checks

- Numbers: an independent Python script (dicts by position, no shared code) gave the code word
  `111101100011101` (p1 … p4 = 1, 1, 1, 0), and for k, a, p1 and a + b the received words, the ones per check, the
  syndromes 15, 3, 1, 6, and for two errors the decoded `01010011101` with 3 wrong bits, before the model was written;
  the model agrees (`sim.test.js`, presets).
- Rule tests broken on purpose, 19 mutations one at a time (coverage by bit j, odd parity, odd passes, the parity bit
  left out of its check, p1 as the highest syndrome bit, correction off by one, syndrome 0 flipping a bit, decoding
  parity positions, flip positions off by one, flips shown before the line, all checks at once, the syndrome a step
  early, the wrong count over data only, all parity bits at once, the line flipping nothing, duplicate flips counted
  twice, Hamming chosen by `hflip`, data placed in reverse, and the verdict taken from the flip count): 18 fail a test.
  The last is equivalent: with Hamming(15,11) two or more flips always leave the data wrong (tested over all 2¹⁵ − 1
  patterns), so "wrong when more than one flip" and "wrong when the data differ" never disagree.
- Page sweep (Playwright, unbuilt from `file://`): every step of the four presets and of five more patterns (no
  error, three errors with syndrome 0, all fifteen flipped, data 0, data 2047 with two flips), in both languages, at
  1920×1080 and 375×812: no console errors, no page scroll, panel without its own scroll, nothing outside the stage,
  no text under 16 px, no clipped label, no caption with a placeholder, `undefined` or `null`. It found two bugs,
  fixed: a placeholder used twice in one caption (the node moved, leaving "0011 = ."), and the header wrapping with
  seven legend items.
- `npm run gate -- crc-error-detection`: passes (63/63 browser checks; the gate runs CRC mode and opens the entry
  `hamming-k`). Screenshots reviewed at 1920×1080 light, dark and grayscale and 375×812 in both languages, in
  Hamming mode at steps 0, 3, 9, 12 and 13 of the presets.
- Not done: a fresh reviewer (the definition of done asks it of new sims; this is a preset task, as `fencing` and
  `cert-chain`'s presets did).

### For the owner

- **The host's title and concept** still say CRC and parity only ("CRC and parity: error detection"; "A CRC catches
  the burst errors that parity misses"), while the page now also corrects. A title like "Error detection and
  correction" (§5.13's name) would cover all three; left as it is (a host decision, and the concept would no longer be
  one sentence about bursts). The `hamming-k` entry carries its own title and concept.

### Unchecked *(check)*

- Hamming 1950 cited without a local copy (above). The 50ohm figures were not available, so the page's data word is
  not the book's.
- The hr terms *unaprijedna korekcija pogrešaka*, *sindrom*, *redundancija*, *ponovni prijenos* come from the task
  file (its "50ohm hr" list), not checked against the hr text of `fehlerkorrektur.md`.

### Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| forward error correction (FEC) | unaprijedna korekcija pogrešaka | task (50ohm hr) *(check)* |
| syndrome | sindrom | task (50ohm hr) *(check)* |
| redundancy | redundancija | task (50ohm hr) *(check)* |
| retransmission | ponovni prijenos | task (50ohm hr) *(check)* |

`Hamming code` (Hammingov kod) is in the glossary and used as `[[Hamming code]]`.

### Shared requests

- **The kit should honour `hidden` on controls** (`kit/kit.css`: `.sd-ctl[hidden] { display: none; }`), so a
  `visible()` control disappears without page CSS; several pages carry the workaround.
- **Per-mode presets and legend** (`visible: (params) => bool` on presets and legend items): pages with modes hide them
  with `nth-child` CSS today (`quorum-split-brain`, here), which breaks when a preset is inserted.
- **A bit strip kit view** (the request above) would also serve this grid: positions with an index row, kinds
  (data / check / ghost), flip marks, and band rows over chosen columns.

### Time

Start 2026-11-09 08:46 (brief read), numbers checked by script 08:49, gate passing and sweep clean about 09:00, notes
and full checks done 09:06: about 20 minutes, one session.
