<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# line-coding: notes

New explorer (task `docs/tasks/w3/line-coding.md`, catalogue `net-line-coding`, §4.1, wave 3). No kit view: the task
names none, and a pair of waveforms on a time axis is not one of K1–K4. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scene.** A CSS grid of a label column and a time column. Rows: the bit cells (buttons; click flips the bit, "−"
  and "+" remove the last bit and add a 0), the NRZ lane, what its receiver reads, the Manchester lane, what its
  receiver reads, and the sender's clock when it is on. Dashed cell boundaries run behind every row (one overlay in
  the time column), dotted guides mark the high (1) and low (0) levels.
- **Waveforms** are one SVG per lane stretched to the row (`preserveAspectRatio="none"`, strokes with
  `vector-effect: non-scaling-stroke`), so they fill whatever height the stage has. Every text, arrowhead, dot and
  ✕ is HTML positioned in percent of the string's length, so no text is scaled by a `viewBox`.
- **Manchester marks:** mid-cell transitions are solid with a ▲ / ▼ arrowhead; boundary jumps are dashed and have no
  arrowhead (they are not bits). Colour is never alone: the two lanes differ by position and label, jumps by dash,
  transitions by arrowhead shape.
- **The receiver.** On the NRZ lane a hollow dot marks each sampling instant at the level it reads; the read row
  writes the bit at the same x, so with drift the bits visibly slide away from the cell centres and a run of eight
  shows seven dots. A cell with no instant gets a red hatched box "✕ lost", a cell with two "+1 extra" (the word is
  dropped above 8 cells, where it does not fit; the symbol stays and the legend names it). Each read row's label
  says "✓ 16 of 16" or "✕ 14 instead of 16". Manchester's receiver reads at its mid-cell transitions (the
  arrowheads), so its read row writes the bits there.
- **Manchester decoder** (SPEC rule 6): a ¾-cell window after each mid-cell transition, the standard way to skip
  boundary jumps. It gives |d| < ⅓, not the task's 50 % (see Deviations).
- **NRZ sampling in integers** (1/200 cell) so the ties of round(k / (1 + d)) are decided by a stated rule, not by
  floating-point noise (SPEC tie-breaks).
- **Edited bits in the URL:** the kit has no text or bit-string param, so the string is a hidden range `code`, the
  bits with a leading 1 (`1001` → 25), which keeps leading zeros and survives a reload and the language switch.
  `pattern` (select) picks one of the five task strings; clicking a cell sets `pattern: 'own'` and writes `code`.
- **"Changed"** (legend): after a click, the clicked cell and every transition of either lane that the click added
  or removed (`changed()` in the model, tested) get the highlighter; a pattern or preset change clears the marks,
  a drift or view change keeps them. "+" marks the added cell.
- **Refused actions:** "+" at 16 bits and "−" at 1 bit carry `aria-disabled` (dashed, muted) and, when pressed, add
  the reason to the caption (highlighted) until the next change; focus stays.
- **Focus:** the stage's buttons cancel focus on mouse-down like the kit's own, so → and Space stay with the page;
  a keyboard user who flips a cell with Enter keeps focus on that cell after the re-render.
- **Caption** is built from two parts, one per visible lane. When NRZ misreads or has no transition, its part comes
  first (that is the point of the state); otherwise Manchester's comes first (the book's boundary-jump sentence).
- **Presets:** `all-ones` also turns the sender's clock on, so the flat NRZ line can be compared with 16 clock
  periods (a deviation: the task sets only drift 0). Otherwise as the task.
- **Mid-cell instants:** a short muted tick at the foot of the time column per cell; the receiver's NRZ sampling
  instants are hollow rings on the waveform at the level read.

## Deviations from the task

- **Param `code` instead of a string `bits`** (above). The model's state still carries `bits` as a string.
- **Rule 5 tie-break:** an instant exactly on the end of a run belongs to the next run, so exact halves of
  k / (1 + d) round down (e.g. a run of 3 at +20 % is read as 2; `Math.round` would say 3). The task's formula
  leaves the tie open; all ties in range are listed in SPEC.md and tested.
- **Rule 6 bound:** with the ¾-cell window the decoder is correct for |d| < ⅓, not |d| < 50 % as the task says.
  The slider stays at ±20 %, so nothing on the page changes; the tests show it fails past ±⅓.
- **`errors`** carry a kind per cell (`lost`, `extra`, `wrong`) instead of bare indices.
- **Rule 8, all-equal strings:** the receiver still reads them, since it knows the start (the preamble the caption
  names); the lane says "no transitions" and the caption says it could not find even the first boundary without a
  preamble. The task does not say whether to read them.
- **Captions:** the task's hr caption (`book-1001`) is used word for word. The en one (`long-run`) is used with
  digits instead of number words ("the run of 8 zeros as 7") and adds "The receiver gets 14 bits instead of 16."
  The others follow the same pattern.

## Sources

- Task file, model and presets.
- URM `book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove" → "Što treba znati" (bitna ćelija, kodiranje,
  Manchester, the `1 0 0 1` walk-through, the receiver reads the direction), footnote `ieee-manchester` (UNH-IOL,
  "10Base-T: Medium Attachment Unit", IEEE 802.3 clause 14: high→low = 0, low→high = 1), footnote
  `rfc5136-kodiranje` (RFC 5136: Manchester or 4/5 coding cuts the capacity); "Pitanja" 3 and 4.
- URM `assets/diagrams/ch06-manchester-kodiranje.svg` (not read for this build; the text walk-through was enough).
- URM `meta/plan-interaktivne-stranice.md` §6, "6 · Signal i medij" (the planned Manchester card).
- NRZ-L, the drift model and the 20 Mbaud figure are not in the book; see unchecked items.

## Unchecked *(check)*

- **NRZ-L polarity** (1 = high). Textbook polar NRZ-L (Stallings, Forouzan) often puts 0 high; the task chose 1 = high.
  It changes nothing about the clock. Not verified against the books from here.
- **10BASE-T at 20 Mbaud** (IEEE 802.3 clause 14), in the explanation only.
- **The drift model** (rules 5 and 6) is derived for this page, not from a source.
- **"brzina signaliziranja"** for *baud rate*: the book has no term; the page writes "20 Mbaud" and "promjena signala
  u sekundi" instead, so the term is not used.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| line coding (encoding) | linijsko kodiranje (kodiranje) | URM ch06 ("Kodiranje (encoding)") |
| bit cell | bitna ćelija | URM ch06 |
| clock | takt | URM ch06 |
| transition | prijelaz (razine) | URM ch06 |
| receiver / sender | primatelj / pošiljatelj | URM ch06 |
| baud rate | brzina signaliziranja *(check: the book has none)* | task file |

`signal` is in the glossary but used as an ordinary word.

## Shared requests

- **Kit: `.sd-ctl[hidden]`.** kit.css gives `.sd-ctl` `display: flex`, which beats the `hidden` attribute that a
  param's `visible()` sets, so a hidden param shows. Worked around with one page rule, as in `sims/amdahl` and
  `sims/ethernet-frame`. Smallest change: `.sd-ctl[hidden] { display: none; }` in kit.css.
- **Kit: a bit-string param** (`type: 'bits'`, value a string of 0/1 with min/max length). This page encodes the
  string as a hidden range; the task file asks to use such a control if the kit gets one.

## Tags and topic

`networks` / `physical-layer` / `intro`, all in `tags.json`. Suggested place in `learn.json`: a new leaf
"Kako signal nosi bitove" / "How a signal carries bits" (the URM ch06 section title) in the same branch as the
`delay` and `errors` leaves, just before `delay`; or, without a new leaf, in `errors` next to `crc-error-detection`.

## Review (playbook §7.4)

A fresh reviewer read the diff against SPEC.md and the task, and broke the model on purpose (22 mutants). It found no
model defect. Fixed from its findings: the `alternating` hint ("a transition in every cell" → "at every cell
boundary"); the explanation's "20 million signal changes" (baud counts signal elements, half-cells, not
transitions); the 1-bit Manchester caption ("all … neighbouring bits differ" with no neighbour); "changed" marks kept
after a preset with the same bits (marks now follow `pattern`/`code`, not the bits); a Manchester `wrong` error shown
as "lost"; a misread all-equal string whose caption did not mention the lost bit; mid-cell ticks the task's scene asks
for (added); two unused strings. Tests added for the preset params and defaults, the drift clamp, `longestRun`, and
the Manchester error kinds past ±⅓. All 23 mutants in the final run fail at least one test.

## Time

Start 18:22, first gate pass about 18:31, review fixes and final gate by 18:42: about 20 minutes.
