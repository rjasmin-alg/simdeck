<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# nominal-vs-actual: notes

New explorer (task `docs/tasks/w3/nominal-vs-actual.md`, catalogue `net-nominal-vs-actual`, wave 3). Rules and expected
numbers: `SPEC.md`. Drawn by the page in HTML and CSS: no kit view draws a to-scale bar.

## Decisions

- **The bar is strictly to scale.** No minimum width for small segments (unlike `delay-components`' time bar): the
  point is that headers are a sliver at 1500 B and most of the bar at 46 B. Every value is in the six cells under the
  bar; a segment at least 6.5 rem wide also writes its percentage in itself.
- **The road** (the book's figure) is 20 cars in two lanes; round(20 × achieved / nominal) of them are solid (carry
  useful data to the finish), the rest hollow and dashed. It repeats the bar's main share in the book's picture.
- **The frame strip** draws the fields in wire order (preamble+SFD, destination, source, type, IP, TCP, data, padding,
  FCS, gap) to scale, with a chip per field giving its bytes; a toggled-off field leaves the strip.
- **"Changed"** marks (yellow underline in the bar, outlined cell, outlined result box when the achieved rate moved)
  compare with the state before the last param change. A preset load or the first render marks nothing; a re-render
  with the same params (theme, resize) keeps the marks. A removed segment has no width, so only its cell shows the mark.
- **Captions** describe the current state by priority (`captionKey` in `sim.js`, tested): stations sharing, the two
  directions of half duplex, loss, an overhead toggled off, else the plain total. Loss is added to the sharing
  sentences ("that already counts p % sent again"); "in bytes: x ÷ 8 = y" is added when the unit is MB/s. Captions
  use Mb/s with one decimal from 10 up (3 significant digits below, so a tiny rate never reads 0.0), as in the task's
  two captions, which come out word for word (`book-ex1` in hr, `shared-hub` in en). Toggled-off overheads are listed
  with the legend's names ("preamble + gap, Ethernet header + FCS and TCP/IP headers").
- **Numbers**: 4 significant digits in the cells and the result (94.93, 949.3, 11.04), one decimal in captions,
  frames/s whole; a no-break space between thousands from five digits up (1 488 095), Croatian decimal comma. The
  `num` helper is copied from `delay-components`' page.
- **Panel layout**: a six-column grid (rate full width; packet and unit; three toggles side by side with the label
  over the switch; duplex; stations and loss side by side) so nine settings and five presets fit at 1920×1080.

## Deviations from the task

- **Rules 4 and 5 combined as k = max(2, n)** on `half-both`, 1 on `full` (SPEC rule 5). Applied one after the other
  they would give ÷2n, and the task's own `shared-hub` preset (half duplex, 3 stations → 31.6 Mb/s) would be 15.8.
  So the `stations` slider counts everyone sending on the medium: its minimum is 2 on half duplex (the two ends), and
  on full duplex it is disabled with the reason ("every station has its own link") and ignored by the model.
- **Toggles have no hints** (the byte counts are in the frame chips): the panel did not fit with them.
- **Title in English** is "Nominal vs achieved throughput" (the book's term for the second half); "Nominal bandwidth vs
  achieved throughput" wrapped the header to two rows and pushed the panel off the screen.
- **`book-ex1` preset hint** points to loss 14 % (81.6 Mb/s) as the task asks; the book's Primjer 1 says "no
  congestion", so the hint reads it as frame loss on the line, not as congestion.
- **Padding** is in the model (rule 1 tie-break) but the page's packet range starts at 46 B as the task says, so it is
  never shown; tests cover it.

## Number check

`node` on 2026-11-08 (the formulas in SPEC.md): 1500 B → 1538 on the wire, 1460 data, 94.9285 %, 94.93 Mb/s at
100 Mb/s, 8127.4 frames/s; loss 14 % 81.64 Mb/s; loss 7 % 88.28 Mb/s = 11.035 MB/s (1 Gb/s: 110.35 MB/s); 46 B at
1 Gb/s 6 / 84 = 7.143 %, 71.43 Mb/s, 1 488 095.2 frames/s; 1 Gb/s 949.28 Mb/s = 118.66 MB/s, `l1` off 1518 B and
961.79 Mb/s; half-both 3 stations 31.643 Mb/s, 1 station 47.464 Mb/s. All match the task and are asserted in
`sim.test.js`.

## Review

A fresh reviewer (a separate agent, no part in the build) read the code against SPEC.md, swept the bar's sum over every
rate, packet size, station count and loss (largest error 2.4·10⁻⁷ bit/s), opened the page headless in both languages
at the edges (no console errors), and ran 42 mutations of `sim.js`. Fixed from the review: the copied `num` grouped
digits with an ASCII space instead of a no-break space (also in the tiny-frames hint); a preset whose params equal the
current ones kept the previous "changed" marks; the float-noise test for `changed` asserted nothing (`EPS` 0 or 0.5
survived); `capOff` for `l2`/`l34`, loss at 1 %, `perStationBps`, padding after data and each preset's unit were
untested; `capLossToo` read as a further cut; `capOff` claimed every Ethernet frame carries the TCP/IP headers;
`offL2` left out FCS; captions rounded tiny rates to 0.0. All six real survivors are now killed. Survivors left as
equivalent or unreachable: the data clamp (zero-byte fields are filtered), the loss clamp (the slider is 0–30),
`sigText`'s zero threshold and `Math.abs`, `inUnit` with an unknown unit, identity rewrites of `transTime`.

## Sources

- URM ch06 `~/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md`: "Što treba znati" (nazivna
  propusnost, ostvarena brzina prijenosa, the three reasons: coding, framing, shared medium and collision; dupleks;
  footnotes rfc5136-kodiranje, rfc5136-uokvirivanje, rfc5136-dijeljenje), "Zašto riječ „brzina” za propusnost zapravo
  nije točna", Primjer 1 (100 advertised, 82 measured), Primjer 4 (11 MB/s ≈ 88 Mb/s).
- URM figure `assets/diagrams/ch06-nazivna-propusnost-ostvarena-brzina.svg` (the road: širina ceste = nazivna
  propusnost, vozila na cilju = ostvarena brzina prijenosa).
- URM ch07 `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adrese" (preamble 7 + SFD 1, 6 + 6 + 2, 46–1500, FCS 4;
  64 and 1518 octets), "Koncentrator" (the shared medium).
- RFC 791 (IPv4 header 20 B), RFC 9293 (TCP header 20 B), RFC 5136 (quoted in ch06).

## Unchecked *(check)*

- Interframe gap 96 bit times = 12 octets (IEEE 802.3 §4.4.2; not in the book).
- The advertised Ethernet rate is after line coding: Manchester 20 Mbaud for 10 Mb/s, 4B/5B 125 Mbaud for 100 Mb/s
  (IEEE 802.3 clauses 14, 24; rule 8).
- 1.488 Mpps as the standard gigabit line rate for minimum frames.
- Retries as goodput × (1 − p) (the task: derived, unchecked).

## For the coordinator

- URM ch06 says coding eats nominal capacity ("Prvo, sama shema kodiranja pojede dio nazivnog kapaciteta"; Primjer 4:
  "razlika … dolazi od troška kodiranja i uokvirivanja"). For Ethernet the nominal rate is quoted after coding, so the
  sim leaves coding out and its explanation says so (rule 8). Worth a word with the book's author before a demo
  contradicts the text (the task's own note).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| nominal bandwidth | nazivna propusnost (URM ch06) |
| overhead | režijski trošak (URM ch06 Primjer 1) |
| half duplex | polu-dupleks (URM ch06) |
| collision | kolizija (URM ch06) |

Also used in plain words (not as terms): preamble — preambula, frame check sequence — provjera ispravnosti okvira
(FCS), full duplex — puni dupleks (URM ch06, ch07). `achieved throughput` and `frame` are in the glossary and used
as `[[…]]`.

## Shared requests

- Models: `delay-components`' transmission delay (size / rate) is not in `models/`; `sim.js` copies it as
  `transTime` (from `sims/delay-components/sim.js @ bf2e9b5`), and the page copies its `num` formatter. A shared
  `link-rate` model (transmission time, rate and unit formatting) would serve both.
- Kit: a `choice` in a narrow grid column stacks its buttons (the unit choice here); a compact choice style would help
  dense panels.

## Time

Start 2026-11-08 19:34, done 2026-11-08 19:52 (18 minutes by the clock, the review included).
