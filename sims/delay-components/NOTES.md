<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# delay-components: notes

New explorer (task `docs/tasks/w3/delay-components.md`, catalogue `net-delay-components`, wave 3). Rules and expected
numbers: `SPEC.md`. Drawn by the page in HTML and CSS: no kit view draws a time bar.

## Decisions

- **The ghost bar** is the page's, from the pure `nextGhost` in `sim.js` (SPEC "Ghost bar"). A preset sets its own
  "before" (each preset has `before` and `params`), also when clicked again or reset with R. Otherwise the "before" is
  the settings before the current run of changes to one param, so a slider drag compares with where it started, not
  with the last slider step (the kit renders on every input event). A re-render with the same params (theme,
  resize) keeps it. After a language switch the ghost bar comes back only when a preset is active
  (the URL carries the preset, not the previous params).
- **Distance is a log ladder, not a continuous log slider.** The kit's range is linear, and a continuous log slider
  cannot land on the presets' exact distances (35 786 km at 0.001 log steps is 35 810 km and 238.9 ms instead of
  238.7). The `distance` param is an index into 36 exact values: 1, 1.5, 2, 3, 5, 7 per decade from 100 m to
  30 000 km, then 35 786 km (geostationary altitude) and 40 000 km. Keyboard steps stay useful; the URL shows the
  index (`?distance=18` is 100 km).
- **Both bars on one scale**, each as long as its total over the larger total, but never shorter than six segment
  numbers' room; when one is clamped, the page says "the shorter bar is not to scale". The satellite preset (1.48 ms
  → 239.2 ms) and near-far (0.045 → 68.6 ms) show it; busy-router (1.24 → 2.32 ms) is fully to scale.
- **Values in the bar**: a segment at least 7.5 rem wide writes its value next to its number; every value is in the
  six numbered cells under the bar (the task: "each labelled with its value in ms"; a 0.012 ms segment has no room).
- **All six segments are always drawn**, zero-length ones too (a 0 ms queue keeps its number at the minimum width),
  so the bar always matches the book's figure.
- **The router's queue is drawn as packets ahead** (U / (1 − U) on average, up to 10 boxes and "+n"), and the
  queuing cell writes "packets ahead × transmission time": the same number as t·U / (1 − U), read as M/M/1.
- **The satellite is the router**: with radio links at 35 786 km (the GEO rung of the ladder) the router card adds
  "(Satelit)", so the label stays while other sliders move.
- **Captions** pick a sentence by which params changed (`captionKey` in `sim.js`, tested): rate alone (faster / slower link), size alone (smaller /
  bigger packet; plus a sentence when the queue moved with it), distance, medium, or both (the latter adds the one-way
  time), load (empty queue / adds q ms / at the cap grows without bound), processing, or "several settings at once".
  With no ghost bar the caption gives the whole sum. The two captions in the task come out word for word
  (`slow-fast-link` in hr, `busy-router` in en).
- **Numbers**: ms everywhere (the task: "each labelled with its value in ms"), 2 / 3 / 4 significant digits under 1 /
  under 100 / from 100 ms; Croatian with a decimal comma; a no-break space between thousands from five digits up
  (35 786, 12 000; 7000 and 1500 stay together).

## Deviations from the task

- **Rate options add 50 Mb/s** (10 / 50 / 100 / 1000 / 10 000 Mb/s): the satellite preset is at 50 Mb/s (0.24 ms),
  which the task's four options lacked.
- **Units of two params**: `load` is in % (0–95 step 5, default 0) instead of 0–0.95 step 0.05, and `proc` in µs
  (0–1000 step 10, default 20) instead of 0–1 ms step 0.01, so the kit's snapping never makes 0.9000000000000001 and
  the URL stays short. The page shows "90 %" and "0,02 ms".
- **Preset "before" choices** the task leaves open: `satellite` before is 100 km of fibre at 50 Mb/s (a ground link;
  only segments 2 and 6 change); `busy-router` goes 0 → 90 % (the 50 % point, 0.12 ms, is in the explanation and the
  spec, not on the bar); `small-packet` goes 1500 B → 64 B.
- **near-far before**: 100 m gives 0.00049 ms (the task rounds it to 0.0005).
- **Caption hr for load**: "Pri opterećenju od 90 % red na usmjerniku dodaje 1,08 ms; veza i udaljenost nisu se
  promijenile." (no term, so its placeholders match the task's English sentence; the kit requires the same
  placeholders in both tables).

## Number check

`node` on 2026-10-25 (the formulas in SPEC.md): s(fibre) = 2.0422·10⁸ m/s (4.897 µs/km), copper 5.054 µs/km, radio
3.336 µs/km; 1500 B: 1.2 ms at 10 Mb/s, 0.24 at 50, 0.12 at 100, 0.012 at 1 Gb/s; 64 B at 10 Mb/s 0.0512 ms; 100 km of
fibre 0.4897 ms, 100 m 0.00049 ms, 7000 km 34.277 ms; GEO 119.37 ms per link, 238.74 one way, 477.48 round trip;
1500 B at 100 Mb/s: queue 0 / 0.12 / 1.08 / 2.28 ms at 0 / 50 / 90 / 95 %; defaults total 1.2393 ms. All asserted in
`sim.test.js`. Each rule was broken once in `sim.js` (transmission with distance, propagation with size, queue as
router time, fibre index, copper factor, processing ×3, no load cap, changed without the 10⁻¹² tolerance, changed
without a ghost bar, layout without the repeat, layout below the minimum, total without processing, display digits):
every mutation fails at least one test. The same for `paramsChanged`, `nextGhost` and `captionKey`.

## Review

A fresh reviewer (a separate agent, no part in the build) read the diff against SPEC.md and mutated `sim.js`
(about 30 mutations). Fixed from the review: a preset clicked again kept the ghost of the last manual change; two
captions began a sentence with a lowercase term; the ghost total was larger than the current one; phone totals
clipped and the hr axis labels overlapped at 375 px; a 12 px gap at the right end of every bar; values missing from
the bar (now in wide segments, SPEC rule 7 reworded); the ghost moved with every slider step of a drag; the
satellite label vanished when a slider moved; `paramsChanged`, the caption choice and the preset values' validity
were untested (now `captionKey`, `nextGhost` and a preset-values test); `msText` returned "0." below 10⁻¹³ ms.
Survivors left as equivalent or unreachable: `>` vs `>=` at the 10⁻¹² tolerance, no lower clamp on load (the slider
starts at 0), layout boundary comparisons.

## Sources

- URM ch06 `~/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md`: "Kašnjenje i pouzdanost" (the four
  components, the slow/fast and near/far cases; footnotes kr-kasnjenje (Kurose & Ross §1.6) and g650-brzina (ITU-T
  G.650.1 §5.4.2.3 c)), "Kad se veza približi svom kapacitetu, kašnjenje ne raste polako nego naglo" (footnote
  pmf-zagusenje, D = D0 / (1 − U)), Primjer 3 (a) satellite, (c) 10 Mb/s vs 1 Gb/s.
- URM figure `assets/diagrams/ch06-sastavnice-kasnjenja.svg`: the six numbered segments and their labels
  (Prijenos, Širenje, Obrada, Čekanje u redu; vremenski slijed, trenutak slanja, trenutak primitka, ukupno kašnjenje).
- Kurose & Ross, *Computer Networking: A Top-Down Approach*, §1.6.

## Unchecked *(check)*

- Fibre group index N = 1.468 (typical for G.652 fibre at 1310/1550 nm; the book cites only the formula).
- Copper velocity factor 0.66 (typical for twisted pair; not in the book).
- GEO altitude 35 786 km (standard value; not in the book).
- Processing 0.02 ms default (the task: derived, unchecked).
- The book's "about 600 ms" for a satellite call against 477 ms round trip of propagation alone: the rest is
  ground segments, processing and coding, which the sim does not model.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| transmission delay | kašnjenje prijenosa (URM ch06) |
| propagation delay | kašnjenje širenja (URM ch06) |
| processing delay | kašnjenje obrade (URM ch06) |
| queuing delay | kašnjenje čekanja u redu (URM ch06) |
| congestion | zagušenje (URM ch06) |
| jitter | varijacija kašnjenja (URM ch06) |

`latency` (latencija) is in the glossary and used as `[[latency]]`.

## Shared requests

- Kit: a `range` with a non-linear scale (log, or a list of values) would let `distance` keep km in the URL instead of
  a ladder index.
- Kit: `Simdeck.h` writes `data-x="null"` for a `null` dataset value (the page uses a class instead). Skipping null
  dataset entries, as for attributes, would avoid the trap.

## Time

Start 2026-10-25 12:15, done 2026-10-25 12:35.
