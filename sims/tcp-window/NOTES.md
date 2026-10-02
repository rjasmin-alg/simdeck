<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-window: notes

Task `docs/tasks/w1/tcp-window.md`, catalogue `urm-window` ("window size vs throughput"). `origin` is the URM book's
`uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/prozor.html`. The simdeck copy is canonical from here on.

## Decisions

- **The source is a duplicate, so this page is rebuilt on the catalogue's concept.** `ugradbeno/prozor.html` is
  byte-identical to `ugradbeno/kontrola-toka.html` (checked with `cmp`; its own top comment says it is embedded under
  both `pojam/prozor.html` and `pojam/kontrola-toka.html`), which `sims/flow-control/` already adopted. A second copy
  would break "one concept per simulator" and duplicate a sim. So the stage is new, on the kit, and shows what the task's
  Goal names, **window size versus throughput**: the sender may have at most one window in flight, an acknowledgment
  comes back one round trip later, so the throughput is min(window / round-trip time, link rate). `flow-control` shows
  the window's edges and that the receiver limits the sender; this page shows what that limit costs in throughput.
  `related: ["flow-control"]` links the two. Recorded as an assumption in the report.
- **Class `stepper`, 16 steps, one millisecond per step.** One millisecond is the time to put one segment of 500 octets
  on the link, so the link carries 500 octets/ms = 4 Mbit/s. Each step: acknowledgments arriving at the start of the
  millisecond first (a segment sent in ms i is acknowledged at the start of ms i + rtt), then a send if the next
  segment fits in the window (last octet ≤ ack + window − 1), else the link is idle. 16 ms is a whole number of round
  trips for every offered RTT (2, 4, 8), so the share of busy milliseconds over the run is exactly min(window / rtt,
  link) / link; a test checks it for all 15 combinations.
- **Tie-breaks:** an acknowledgment that arrives at the start of a millisecond is used in it (ack before send); without
  that a window equal to the path would show a gap every round trip. A segment ending exactly on the right edge fits.
  A window exactly equal to the path is its own case (`by: 'both'`, "the window exactly fills the path").
- **Params:** window (choice 500 / 1000 / 2000 / 3000 / 4000 octets; the kit allows five options) and round-trip time
  (2 / 4 / 8 ms). They replace the original's acknowledgment slider; the acknowledgment now moves with the steps.
- **The book's numbers are the first preset** (`book`, "Primjer iz knjige", the fragment's locked button name, and the
  defaults): window 1000 octets, segments of 500, everything before octet 1500 acknowledged (figure
  `ch13-prozor-kontrola-toka.svg`, moment 1). Step 1 is the figure's moment 1 (ack 1500, in flight 1500–1999, right edge
  2499); at step 5 acknowledgment 2000 moves the window by 500 to 2000–2999, same size (the fragment's exercise 1). The
  fragment's top comment names no "Primjer N": its numbers are the figure's (`meta/chapter-13/diagrams.yaml`); the
  window of 1000 is the figure's own choice, not the text's. **The round-trip time of 4 ms and the link rate are
  simdeck's**: the book gives neither. The explanation says so.
- **Exercises (`ia-zadatak`) became preset hints**, without their answers:
  - exercise 1 (ack 1500 → 2000: how far did the window move, did its size change?) → `book`, plus "what share of the
    time is the link busy?";
  - `full` (2000 / 4 ms, the window equals the path) asks whether the link is ever idle;
  - `far` (2000 / 8 ms) asks for the rate and the window it would need, and the book's end-of-chapter question 27 (the
    16-bit window field: how many octets at most);
  - exercises 2 and 3 (what the window field protects; flow versus congestion control) → `big` (4000 / 4 ms, the link
    limits): "what limits the sender now? would an even larger window help when the network is congested?".
- **The "why" box** (flow control versus congestion control) is the explanation's fourth paragraph, nearly word for
  word. The others: one window per round trip, what the path holds (bandwidth-delay product), the 16-bit field and
  window scaling (ch. 13 "Šire o temi"), and the simplification.
- **The original's text version (`<details>`) is gone:** the caption is the kit's live region.
- **Stage:** the path folded in two rows, one slot per millisecond of the round trip: segments go right on the top row
  (first half of the round trip), acknowledgments come back left on the bottom row (second half). Then a 16-ms timeline
  (link busy with the segment number / idle cross-hatched; a row of acknowledgment marks), and facts: what the path
  holds, in flight / window, link busy, achieved throughput so far, and the limit with what limits.
- **Colour is not the only carrier:** segment = solid fill with its number; idle = cross-hatch, dotted border, "–";
  acknowledgment = round shape and ✓; segment on the way = hatch, acknowledgment on the way back = round and ✓; empty
  slot = dashed with its millisecond. Checked in the grayscale screenshot.
- Numbers on the page: octets/ms as whole numbers, Mbit/s to one decimal, with a decimal comma on Croatian pages.
- The model (`limit`, `fits`, `step`) is pure and promotable to `models/` with `flow-control`'s as the shared TCP model
  of catalogue §5.8. It does not reuse `flow-control`'s code (that model has no time or round trip); it reuses its
  numbers (segment 500, start 1500, window 1000).

## Sources

- The fragment (sentences, exercises, the "why" box) and `output/interaktivno/static/komponente.js`
  (`IA.Klizac`, `IA.Koraci`, `IA.gumbPrimjer`, `IA.Zadatak`); `scripts/check-web.py` (locked button names).
- URM book ch. 13 (`book/chapters/13-transportni-sloj.md`): the window field (RFC 9293 §3.1 quote,
  `[^rfc9293-window]`), sequence and acknowledgment numbers, "TCP: pouzdanost, kontrola toka i kontrola zagušenja" with
  its Peterson & Davie quote, "Šire o temi" (16 bits, 65 535 octets, window scaling), question 27.
- URM book ch. 6 (`book/chapters/06-fizicki-sloj.md`): *nazivna propusnost* (nominal bandwidth), *ostvarena brzina
  prijenosa* (achieved throughput), *latencija*, and "kružno (round-trip) vrijeme" (the `ping` box).
- Figure `assets/diagrams/ch13-prozor-kontrola-toka.svg` (not copied).
- Every number in `sim.test.js` is checked against those passages or computed from the model's stated units.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| round-trip time | kružno vrijeme (ch. 6, "kružno (round-trip) vrijeme") |
| nominal bandwidth (link rate) | nazivna propusnost (ch. 6) |
| bandwidth-delay product | umnožak propusnosti i kašnjenja — simdeck's, the book has no term *(check)* |
| window scaling | skaliranje prozora (ch. 13) |
| window (TCP window field) | prozor (polje prozora) — also in `flow-control`'s list |
| acknowledgment | potvrda — also in `flow-control`'s list |
| flow control / congestion control | kontrola toka / kontrola zagušenja — also in `flow-control`'s list |
| in flight | u letu — simdeck's, as in `flow-control` *(check)* |

*achieved throughput* = ostvarena brzina prijenosa is in the glossary (URM) and used as `[[achieved throughput]]`.
Note the glossary also has *throughput* = propusnost (ossimulator), which the URM book uses for bandwidth; this page
follows the URM book.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Catalogue / OPEN.md:** the URM book embeds one fragment under two concept pages; `flow-control` and this sim now
  split them into "the receiver limits the sender" and "window size versus throughput". If the owner would rather have
  one page, this sim can become presets of `flow-control` (it would need a time axis there).

## Checks not done here

- A real projector and a lecturer with a clicker.
- A fresh reviewer reading the diff against these rules (COMMON.md §8 asks it of new sims; the rules are here and in
  `sim.js`, there is no `SPEC.md`). The rules were broken on purpose once each (`≤` → `<` on the right edge, ack one ms
  late, the `both` tie, an acknowledgment that does not advance): every one fails tests.
- Freezing the original is outside simdeck (OPEN.md, "one home for networking interactives").

## Time

Start 2026-10-02 21:15, done 21:26 (about 11 minutes, one session).
