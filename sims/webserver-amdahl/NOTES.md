<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# webserver-amdahl: notes

Adopted from `single-page-labs/webserver-amdahl.html` (task `docs/tasks/w1/webserver-amdahl.md`, catalogue
`spl-webserver-amdahl`). The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`**, like `amdahl` (the same kind of page): the sliders drive the drawing live; no steps.
- **Layout and chart follow `sims/amdahl/`** so the two pages read as one family: meters, the formula with the live
  numbers, a time row per component (click to select), the classic Amdahl curve with ceiling and current point.
- **Model copied from `sims/amdahl/sim.js` @ f670166** (`isSerial`, `amdahl`, the generalised law, bottleneck rule
  with lowest-number tie-break), per COMMON.md §6. Added: `limit` per part (the speedup if that part took no time,
  the rest as it is) and `progress` toward the ceiling (the original's "progress toward ceiling" bar, now a meter line).
- **Components and fractions kept:** network I/O 45 %, database 25 %, application logic 15 %, disk I/O 10 %,
  application cache 5 %; sliders 1–99 % and 1–100× in steps of 0.5, as in the original.
- **Presets (keys 1–7):** the baseline, the original's five per-component worked examples (network 10×, database 10×,
  logic 10×, disk 50×, cache 100×) and network + database 10× (2.70×, ceiling 3.33×), which the original did not have:
  it shows that the two large parts together are worth more than any one alone.
- **The detail panel** (what / how / ways to improve / gain / cost / counter-intuitive / Amdahl analysis / real-world
  example per component) is split: the stage shows, for the selected component, its live limit and the
  counter-intuitive effect; the "Ideja" explanation has what, how, improvements and cost per component, and the
  worked examples with numbers. The original's "Amdahl analysis" text blocks became the live limit plus the presets.

## Deviations from the original (and why)

- **Fractions that do not add up to 100 are scaled to 100**, as in `amdahl`, so the baseline is always 1×. The original
  computed on raw fractions and showed "✗ must = 1.000". The stage says when the sum is off.
- **Number inputs dropped** (the original allowed up to 1000× by typing); the kit has sliders only.
- **Emoji icons dropped**; components are numbered 1–5.
- **Numbers corrected:** the CPU example said `1 / (0.815 + 0.015) = 1.20×`, above its own ceiling of 1.18×; correct
  is `1 / (0.85 + 0.015) = 1.16×`. "Doubling CPU cores gives ~1.18×" (that is the ceiling) became "a CPU twice as fast
  gives 1.08×". Every number on the page is checked in `sim.test.js`.
- **Concepts, not tools (COMMON.md §1):** product and company names removed (two web servers, two cache servers, a
  CDN product, five companies' anecdotes, programming languages by name, a kernel I/O interface, `sendfile`, NVMe,
  gzip). The five "real-world example" boxes were all named-company anecdotes with unverified figures; dropped.
  Techniques stay as concepts (zero-copy send, HTTP/2 multiplexing, connection pool, read replicas, indexes,
  in-process cache, pipelined lookups, page cache, asynchronous I/O).
- **Claims softened:** "most DB latency is NOT from slow queries" → "often"; "more replicas SLOW DOWN write-heavy
  workloads" → "do not help: replication can eat the gain"; "async I/O can INCREASE latency" → throughput vs latency,
  in the explanation's last section.
- **Fonts:** JetBrains Mono and Syne from Google Fonts dropped; kit fonts. No other network loads existed.
- **Canvas → SVG** at 1:1 in pixels (text ≥ 16 px), redrawn when the stage resizes; x axis labelled "improvement
  factor n (or number of processors)", since on this page n is a speedup factor, not processors.

## Sources

- The original page (model, fractions, worked examples, per-component text).
- Amdahl, G. M. (1967), "Validity of the single processor approach to achieving large scale computing capabilities".
- *(check)* The fractions 45/25/15/10/5 are the original's illustrative "typical request", not measured.
- *(check)* Access times (spinning disk a few ms, flash ~0.1 ms or less) are order-of-magnitude figures.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| speedup | ubrzanje |
| bottleneck | usko grlo |
| serial fraction | serijski udio |
| bandwidth | širina pojasa |

`latency`, `throughput` and `cache` come from the glossary (`[[…]]`).

## Shared requests

- **models/: promote the generalised Amdahl model.** `amdahl` and this sim carry the same `isSerial`, `amdahl`,
  shares/after/serial/ceiling/bottleneck/equivalentN code. A shared `models/amdahl.js` with `initial(parts)` over
  `[{ weight, speedup }]` would serve both; this sim adds `limit` and `progress`.
- **kit.css: `.sd-ctl[hidden]` is still shown** (the request `amdahl` filed); worked around in this page's CSS.
- **Glossary:** add the four term pairs above with `"src": "simdeck"`.
- **Catalogue §5.18** says webserver-amdahl becomes a preset of `amdahl` later. This sim is kept separate as the task
  asks; folding it in would need a `web-request` profile in amdahl plus the per-component notes, i.e. a later task.

## Checks not done here

- Real projector and clicker (an explorer has no step keys; `R` and 1–7 work).
- The explanation, opened, scrolls inside the panel at 1920×1080 (the gate checks the panel closed).

## Time

Start 2026-10-02 06:08, done 06:17 (about 10 minutes of wall clock, one session).
