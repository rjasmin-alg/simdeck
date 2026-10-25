<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# delay-components: spec

Explorer (task `docs/tasks/w3/delay-components.md`, catalogue `net-delay-components`, §4.1). One concept:
**the delay of one packet over one hop is the sum of four kinds of delay, and each depends on its own variable**:
transmission on packet size and link rate, propagation on distance and medium, queuing on load, processing on the
router.

## Scene

The book's one-hop path (URM ch06, figure `ch06-sastavnice-kasnjenja.svg`): source computer — link 1 — router —
link 2 — destination, left to right. Under it one time bar in the figure's six numbered segments, in this order:

| # | Segment | Kind | Where |
|---|---|---|---|
| 1 | transmission | `trans` | the source pushes the packet onto link 1 |
| 2 | propagation | `prop` | the signal crosses link 1 |
| 3 | processing | `proc` | the router reads the header and picks the way out |
| 4 | queuing | `queue` | the packet waits in the router's output queue |
| 5 | transmission | `trans` | the router pushes the packet onto link 2 |
| 6 | propagation | `prop` | the signal crosses link 2 |

and the total at the right ("ukupno kašnjenje"). A second, ghosted bar above it shows the settings before the last
change.

## State

`initial(params)` → `{ L, R, d, s, U, tProc, trans, prop, proc, queue, router, ahead, atCap, segments, total }`.
Times in seconds, `L` in bits, `R` in bit/s, `d` (per link) in metres, `s` in m/s. Both links share `R`, `d` and the
medium (the book's "same link" framing). `segments` is the six rows above, `{ n, kind, link, t }`, in that order.

## Rules

1. **Total** = the sum of the six segments = 2·trans + 2·prop + proc + queue: processing, queuing, transmission and
   propagation, summed over every node and link of the path (URM `06-fizicki-sloj.md` "Kašnjenje i pouzdanost",
   footnote kr-kasnjenje: Kurose & Ross §1.6).
2. **Transmission** per link = L / R (L = 8 × packet bytes). It does not depend on distance or medium (same section;
   Primjer 3 (c)).
3. **Propagation** per link = d / s. It does not depend on packet size, link rate or load (same section; Primjer 3 (a)).
4. **Speed in the medium** s = c / N with c = 299 792 458 m/s:
   - fibre: group index N = 1.468 → s = 2.0422·10⁸ m/s, 4.897 µs per km (ITU-T G.650.1 §5.4.2.3 c), cited in ch06
     footnote g650-brzina; the formula is the standard's, the value N = 1.468 *(check)*, a typical G.652 group index);
   - copper: s = 0.66 c, 5.05 µs per km *(check: a typical velocity factor of twisted pair; not in the book)*;
   - radio (air or vacuum): s = c, 3.336 µs per km.
5. **Queuing** at the router: its time in system is t / (1 − U) with t = L / R of link 2, so the queue adds
   t·U / (1 − U). At U = 0.5 the router's time doubles; as U → 1 it grows without bound (ch06 "Kad se veza približi
   svom kapacitetu", footnote pmf-zagusenje: D = D0 / (1 − U); the M/M/1 reading, with D0 the router's own
   transmission time, is derived). The average number of packets ahead is U / (1 − U), so queuing = packets ahead × t.
   U is capped at 0.95 so the bar stays finite; at the cap the page writes "→ ∞".
6. **Processing** is a constant per router (default 0.02 ms, derived, unchecked); the end hosts add none.
7. **Edges.** U = 0 gives queuing exactly 0; d = 0 gives propagation exactly 0 (the model accepts d = 0; the
   slider's smallest distance is 100 m). In the bar a segment narrower than its minimum width (the room for its
   number, about 1 % to 3 % of the bar) is drawn at that minimum, with its number, so a 0.012 ms segment (or a 0 ms
   queue) never disappears; the other segments share the rest in proportion to their times. Every segment's value
   in ms is in its numbered cell under the bar; a segment wide enough (7.5 rem) also writes it in the bar.

### Tie-breaks and layout rules

- **Ghost bar** (`nextGhost`): a preset sets its own "before". Otherwise the ghost shows the settings before the
  current run of changes: a run is consecutive changes to one and the same param (a slider drag, arrow keys,
  medium fibre → copper → radio), so a drag from 100 km to 7000 km compares with 100 km, not with the last slider
  step. A change to another param, or to several at once, starts a new run from the settings just before it. A
  re-render with unchanged params keeps the ghost. With no previous settings (first render) there is no ghost.
- **Caption** (`captionKey`): rate alone, size alone, distance and/or medium, load alone (0, below the cap, at the
  cap), processing alone, else "several at once"; no change or no ghost gives the whole sum.
- **Changed**: a segment is "changed" when its time differs from the ghost bar's by more than 10⁻¹² s (float
  noise). With no ghost bar nothing is changed.
- **Bar layout** (`barLayout(times, minShare)`): shares of the bar's length in segment order. Every segment whose
  proportional share is below `minShare` gets exactly `minShare`; this repeats until no remaining segment falls
  under it (a raised small segment can push a middle one below the minimum); the rest share what is left in
  proportion. All shares sum to 1. If the minimums alone fill the bar (6 × minShare ≥ 1) or the total is 0, every
  segment gets 1/6. Equal times get equal shares.
- **Two bars, one scale**: each bar's length is its total over the larger total, but never shorter than six
  minimum widths plus a little, so a 1.5 ms bar beside a 239 ms bar stays readable (it is drawn not to scale, and
  says so).
- **Load cap**: a load above 0.95 is taken as 0.95 (the slider stops there anyway).

## Params

| key | control | values | default |
|---|---|---|---|
| `size` | select | 64 / 576 / 1500 / 9000 B | 1500 |
| `rate` | select | 10 / 50 / 100 / 1000 / 10 000 Mb/s | 100 |
| `distance` | range over a log ladder (index) | 0.1 … 40 000 km, per link | 100 km |
| `medium` | choice | fibre / copper / radio | fibre |
| `load` | range, % | 0 … 95 step 5 | 0 |
| `proc` | range, µs | 0 … 1000 step 10 | 20 (0.02 ms) |

Distance ladder (km): 0.1, 0.15, 0.2, 0.3, 0.5, 0.7 and the same × 10ⁿ up to 30 000, then 35 786 (geostationary
altitude) and 40 000. 36 positions; every preset's distance is on it.

## Presets (each sets a "before" bar and an "after" bar)

All numbers checked with `node` (NOTES.md "Number check"). Per link unless said.

| # | id | before → after | expected |
|---|---|---|---|
| 1 | `slow-fast-link` | 1500 B, 100 km fibre: 10 Mb/s → 1 Gb/s | transmission 1.2 → 0.012 ms; propagation 0.49 ms in both (ch06 Primjer 3 (c); numbers derived) |
| 2 | `near-far` | 1 Gb/s, 1500 B, fibre: 100 m → 7000 km | propagation 0.00049 → 34.3 ms; transmission 0.012 ms in both (ch06 two-distance case; derived) |
| 3 | `satellite` | 50 Mb/s, 1500 B: 100 km fibre → 35 786 km radio (GEO relay, the router is the satellite) | propagation 0.49 → 119.4 ms per link, 238.7 ms one way; transmission 0.24 ms; round trip ≈ 477 ms before processing, the book's "about 600 ms" (Primjer 3 (a); altitude 35 786 km *(check)*) |
| 4 | `busy-router` | 1500 B, 100 Mb/s, 100 km fibre: load 0 → 90 % | queuing 0 → 1.08 ms; at 50 % it would be 0.12 ms (router time 0.12 → 0.24 ms; the page shows queuing, not router time) (ch06 pmf-zagusenje; derived) |
| 5 | `small-packet` | 10 Mb/s, 100 km fibre: 1500 B → 64 B | transmission 1.2 → 0.051 ms; propagation 0.49 ms unchanged (derived) |

Defaults (1500 B, 100 Mb/s, 100 km fibre, load 0, 0.02 ms): transmission 0.12, propagation 0.4897, processing
0.02, queuing 0; total 1.239 ms.

## Display

- Times in ms: under 1 ms two significant digits, under 100 ms three, from 100 ms four, trailing zeros dropped
  (1.2, 0.012, 0.49, 0.00049, 34.3, 238.7). Croatian writes a decimal comma.
- Legend: transmission (c1, solid), propagation (c2, hatched), processing (c3, dotted), queuing (c4, hollow);
  "changed" marks the segments that moved since the last input.

## Out of scope

Jitter over time (named in the explanation only), packet loss, TCP throughput and the bandwidth-delay product,
paths with more than one router.
