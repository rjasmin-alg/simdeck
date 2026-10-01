# cache-hit-ratio: Cache hit ratio and latency

| | |
|---|---|
| Task | `cache-hit-ratio` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-cache-hit-ratio` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/cache-hit-ratio/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | OS, ARH |
| Topic / tags / level | `distributed` / `performance` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a few percent of hit ratio dominates average latency**.

The student: sliders for hit ratio and miss cost.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- J. L. Hennessy and D. A. Patterson, *Computer Architecture: A Quantitative Approach*, appendix/chapter on
  memory hierarchy ("average memory access time = hit time + miss rate × miss penalty") *(check edition)*
- `~/projects/ossimulator/src/modules/raid-cache/` (cache replacement page: hit/miss terms „H / M",
  scenarios `cache-dead-burst`, `cache-scan`) for the neighbouring concept and Croatian terms
## Model and presets

- **Scene:** requests flow into a **cache**; hits return along a short path, misses continue to the
  **backend** and back. A big curve: average latency against hit ratio from 80 % to 100 % (it bends hard
  near 100 %), the current point marked. Two gauges: **average latency** and **backend load** (requests/s
  that miss). A "cold cache" button drops the hit ratio to 0 for a moment.
- **State:** pure function of params → `{ h, avgMs, missRate, backendRps, speedupVsNoCache }`.
- **Live:** the hit-ratio slider moves the point; the miss-cost slider changes the curve's steepness.
- **Rules:**
  1. Average access time = hit time + miss rate × miss penalty, miss rate = 1 − hit ratio (Hennessy &
     Patterson, *Computer Architecture: A Quantitative Approach*, "average memory access time") (check).
  2. Improvement depends on the **miss rate**, not the hit ratio: 90 % → 99 % hits cuts misses 10×.
  3. Backend load = request rate × miss rate; feeding that into `utilisation-latency` shows the backend's
     own latency (derived).
  4. A cold cache (after a restart) sends the full request rate to the backend until it warms up (derived).
  5. Tie-break / edge: at h = 100 % the average equals the hit time; at h = 0 it is hit time + penalty (a
     lookup still costs the hit time).
- **Params:** `h` range 50–100 % in 0.1 % steps (95 %); `hitMs` choice 0.001 (RAM) / 1 (local) (1);
  `penaltyMs` choice 10 / 100 / 1000 (100); `rate` choice 100 / 1000 req/s (1000); button "cold cache".
- **Presets** (rule 1 with hit 1 ms, penalty 100 ms; derived, checked by hand):
  1. `ninety` — h 90 %: average **11 ms**; backend gets 100 req/s of 1000.
  2. `ninety-five` — h 95 %: **6 ms**; backend 50 req/s.
  3. `ninety-nine` — h 99 %: **2 ms**; backend 10 req/s: four more points of hit ratio, 5.5× faster than
     preset 1.
  4. `cpu-cache` — hit 1 ns, penalty 100 ns (memory): 95 % → 6 ns, 99 % → 2 ns (same shape at another scale).
  5. `cold-start` — preset 3, then "cold cache": backend jumps from 10 to **1000 req/s** (100×); with a backend
     capacity of 200 req/s it saturates (link `retry-storm`, `utilisation-latency`).
- **Steps:** explorer, no steps.
- **Legend:** hit path (short solid arrow), miss path (long dashed arrow), current point (ring on the curve),
  backend load gauge (bar with capacity line). "Changed" marks gauges that crossed the backend capacity line.
- **Captions:**
  - hr: „S 90 na 99 % pogodaka (*hit ratio*): promašaja je deset puta manje, a prosječno kašnjenje pada s
    11 na 2 ms."
  - en: "Cache restarted cold: every request goes to the database, 1000 per second instead of 10."
- **Terms:** cache — priručna memorija (ossimulator `raid-cache`; UL ch12 „priručna sprema"); hit / miss —
  pogodak / promašaj (ossimulator `raid-cache` „H / M"); hit ratio — omjer pogodaka; miss penalty — cijena
  promašaja; backend — pozadinski sustav (check); cold cache — hladna priručna memorija (check).
- **Misconceptions:** "95 % and 99 % hit ratio are about the same"; "the cache only makes things faster" (it
  also hides how much load the backend could not take); "average latency describes every request" (hits and
  misses are two populations: link `tail-latency`).
- **Out of scope:** replacement policies (ossimulator `raid-cache`: LRU, LFU, FBR), cache coherence,
  write policies (`write-cache`), TTL and invalidation.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh cache-hit-ratio sims/cache-hit-ratio` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cache-hit-ratio/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
