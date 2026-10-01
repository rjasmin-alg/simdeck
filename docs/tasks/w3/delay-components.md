# delay-components: Four kinds of delay

| | |
|---|---|
| Task | `delay-components` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-delay-components` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/delay-components/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `physical-layer` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **propagation vs transmission vs queuing vs processing delay**.

The student: sliders for distance, bandwidth, packet size, load.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md` (Uvod u računalne mreže): "Kašnjenje i pouzdanost: koliko dugo, i koliko sigurno" (four components; footnotes kr-kasnjenje, g650-brzina), "Kad se veza približi svom kapacitetu, kašnjenje ne raste polako nego naglo" (footnote pmf-zagusenje, D = D0/(1−U)), Primjer 3 "koja sastavnica kašnjenja objašnjava simptom"
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch06-sastavnice-kasnjenja.svg` (the six numbered segments of one hop)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 "Primijenjeno: 11 stranica", page 6 "Signal i medij" (sastavnice kašnjenja)
- Kurose & Ross, *Computer Networking: A Top-Down Approach*, §1.6 (delay components, L/R); ITU-T G.650.1 §5.4.2.3 c) (speed in fibre from the group index)
- Catalogue seed: URM card ch06

## Model and presets

- **Scene:** the book's one-hop path (ch06 figure `ch06-sastavnice-kasnjenja.svg`): source computer — link 1 —
  router — link 2 — destination, drawn left to right. Under it one horizontal **time bar** split into the six
  numbered segments of the figure (1 transmission, 2 propagation on link 1, 3 processing, 4 queuing at the
  router, 5 transmission, 6 propagation on link 2), each labelled with its value in ms, and the total
  ("ukupno kašnjenje") at the right. A second, ghosted bar shows the previous settings so a change is visible.
- **State (explorer):** `{ L, R, d, medium, U, tProc }` → derived `{ trans, prop, proc, queue, total }` per
  segment, in seconds. Both links share R, d and medium (the book's "same link" framing).
- **What the params drive live:** packet size and link rate change only segments 1 and 5; distance and
  medium change only 2 and 6; load changes only 4; processing time changes only 3. The bar recomputes on
  every input.
- **Rules:**
  1. Total latency = processing + queuing + transmission + propagation, summed over every node and link on
     the path (URM `06-fizicki-sloj.md` "Kašnjenje i pouzdanost", footnote kr-kasnjenje: Kurose & Ross §1.6).
  2. Transmission delay = L / R (bits / bit/s); it does not depend on distance (same section; Primjer 3 (c)).
  3. Propagation delay = d / s; it does not depend on packet size or link rate (same section; Primjer 3 (a)).
  4. s = c / N: fibre group index N = 1.468 → s ≈ 2.04·10⁸ m/s ≈ 4.9 µs per km (ITU-T G.650.1 §5.4.2.3 c,
     cited in ch06; N value (check)); copper ≈ 0.66 c (check); radio in air/vacuum = c.
  5. Queuing: the router's time in system is t/(1−U) where t = L/R of link 2, so queuing = t·U/(1−U); at
     U = 0.5 the delay doubles, as U → 1 it grows without bound (ch06 "Kad se veza približi svom kapacitetu",
     footnote pmf-zagusenje: D = D0/(1−U); M/M/1 reading derived). Cap U at 0.95 so the bar stays finite;
     show "→ ∞" text at the cap.
  6. Processing is a constant per router (default 0.02 ms, derived, unchecked); the end hosts add none.
  7. Edge: with U = 0 queuing is exactly 0; with d = 0 propagation is 0. Segments under 1 % of the total are
     still drawn at a minimum width with their value, so a 0.012 ms segment never disappears.
- **Params:** `size` select 64 / 576 / 1500 / 9000 B (default 1500); `rate` select 10 Mb/s, 100 Mb/s, 1 Gb/s,
  10 Gb/s (default 100 Mb/s); `distance` range 0.1–40 000 km, log scale (default 100 km); `medium` choice
  fibre / copper / radio (default fibre); `load` range 0–0.95 step 0.05 (default 0); `proc` range 0–1 ms
  step 0.01 (default 0.02).
- **Presets:**
  1. `slow-fast-link` — Primjer 3 (c): 1500 B, 100 km fibre, 10 Mb/s vs 1 Gb/s. Transmission 1.2 ms vs
     0.012 ms per link; propagation 0.49 ms per link in both. From URM ch06 Primjer 3; numbers derived.
  2. `near-far` — same 1 Gb/s link, 100 m vs 7000 km fibre: propagation 0.0005 ms vs 34.3 ms per link,
     transmission 0.012 ms in both. From ch06 "Kašnjenje i pouzdanost" (two-distance case); numbers derived.
  3. `satellite` — Primjer 3 (a): GEO relay, radio, 2 × 35 786 km per direction → 238.7 ms one way at 50 Mb/s
     (transmission 0.24 ms); round trip ≈ 477 ms before processing, the book's "about 600 ms". Derived;
     altitude (check).
  4. `busy-router` — 1500 B, 100 Mb/s: U = 0 → queuing 0; U = 0.5 → 0.12 ms (router time doubles from 0.12
     to 0.24 ms); U = 0.9 → 1.08 ms. From ch06 footnote pmf-zagusenje; numbers derived.
  5. `small-packet` — 64 B vs 1500 B on 10 Mb/s: 0.051 ms vs 1.2 ms transmission, propagation unchanged.
     Derived.
- **Steps:** none (explorer); each preset sets the "before" bar and the "after" bar.
- **Legend:** transmission (c1, solid), propagation (c2, hatched), processing (c3, dotted), queuing (c4,
  hollow); "changed" marks the segments that moved since the last input.
- **Captions:**
  - hr: "Brža veza skratila je *transmission delay* (kašnjenje prijenosa) s 1,2 ms na 0,012 ms; *propagation
    delay* (kašnjenje širenja) ostao je 0,49 ms."
  - en: "At 90 % load the router's queue adds 1.08 ms; the link and the distance did not change."
- **Terms:** latency — latencija (kašnjenje); transmission delay — kašnjenje prijenosa; propagation delay —
  kašnjenje širenja; processing delay — kašnjenje obrade; queuing delay — kašnjenje čekanja u redu;
  congestion — zagušenje; jitter — varijacija kašnjenja; throughput / link rate — propusnost.
- **Misconceptions:** a faster link makes the signal travel faster (it only pushes bits on sooner); distance
  affects transmission delay; latency is one number rather than a sum per hop.
- **Out of scope:** jitter over time (mentioned in the explanation only), packet loss, TCP throughput and
  bandwidth-delay product, multi-hop paths beyond one router.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh delay-components sims/delay-components` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/delay-components/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
