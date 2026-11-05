<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# iops-latency: notes

New explorer (task `docs/tasks/w3/iops-latency.md`, catalogue `sto-iops-latency`, wave 3). No kit view fits (curves
against queue depth), so the page draws its own SVG at 1:1, like `utilisation-latency`. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **Lanes P = 1 / 1 / 8 / 32** (HDD random, HDD sequential, SATA SSD, NVMe SSD). The task says "1 for a spinning disk,
  several for flash" and gives no number; 8 and 32 are the values its preset numbers imply (SATA 74,455 IOPS at QD 32 =
  8 / 0.10745 ms; NVMe 393,288 at QD 32 and at QD 128 = 32 / 0.08137 ms). *(check)* against data sheets.
- **Rule 3 is compared exactly**: access time is kept in integer µs and the cap test is (min(QD, P) − 1) × bs ≥
  bandwidth × access (no float division). **Equal counts as capped**, so sequential HDD (access 0) is
  bandwidth-bound at every QD, QD 1 included: the honest label for a streaming disk.
- **Bound label tie-break** as the task's rule 6: bandwidth, then parallelism if QD ≥ P, then latency. With P = 1, QD 1
  is already "parallelism": the badge says "the disk's one arm" for P = 1 instead of "all lanes busy".
- **"Changed"** (the task: "marks the gauge whose bound changed"): each bound belongs to one gauge (bandwidth →
  throughput, parallelism → IOPS, latency → latency); when the bound changes, that gauge's card and the limit badge are
  highlighted. Same bound → nothing marked.
- **Charts**: one per gauge, under it (three small multiples sharing the log₂ QD axis 1…256), since the three metrics
  have different units. Each shows the dashed QD = P line; the throughput chart also the dashed bandwidth ceiling.
  Clicking or dragging on any chart sets QD (powers of two, clamped to 128).
- **Scene**: the queue drawing follows `utilisation-latency` (small squares on a line, "+n" past 40), then the device
  box with P lane slots (filled = a request in a lane, dashed = free), then a bandwidth bar filled to MB/s ÷ ceiling
  (thick red frame when full), then the limit badge (border style per bound: double, solid, dashed).
- **Captions**: a "what changed" sentence when exactly one of device, block, QD changed (before → after), then one
  sentence for the bound. The task's two captions are `bArmQueue` (hr) and `bBandwidth` (en), generalised with the
  numbers; both languages have every sentence.
- **Number style**: IOPS whole, thousands separated from five digits (12,290 / 12.290; 8085); ms two significant digits
  below 100 (0.081, 5.2, 13), whole above; MB/s one decimal below 10, whole above; MB = 10⁶ B, KiB = 1024 B.
- **Units**: throughput always in MB/s (3000 MB/s, not 3 GB/s), so the gauge, the chart and the ceiling share a unit.
- **Concepts, not tools**: no benchmark tool is named (`fio` is in Sources only). HDD, SATA, NVMe and SSD are
  technology names the concept depends on.

## Deviations from the task

- **`qd` control** is a drop-down (`select`), not a choice: the kit's segmented choice takes at most 5 options and QD
  has 8. The charts are the "slider" for QD (click or drag).
- **hr caption**: the task's „…dublji red (*queue depth*) ne donosi više operacija u sekundi (*IOPS*)…" puts the
  Croatian first; the page writes „veća dubina reda ne donosi više IOPS" (no English term in the caption; the terms are
  introduced in the explanation per the term rule, COMMON §4).
- **Presets** open on their main point: `hdd-random` at QD 32 (its hint gives QD 1), `hdd-sequential` at QD 1 (switch
  the device to see random at 1 MiB: the caption gives 191 → 76 IOPS, 200 → 79 MB/s), `nvme-qd` at QD 32,
  `nvme-big-blocks` at QD 32, `sata-vs-nvme` at QD 32.
- **Chart axis** to 256 as the task says, while QD stops at 128: the curves continue one step past the control.
- **`littles-law` link** (task rule 4): the catalogue's `perf-littles-law` sim does not exist yet, so `related` cannot
  name it (the check refuses unknown ids). Add `"littles-law"` (or its final id) to `related` once it is built.
- **Capped with free lanes** (e.g. NVMe 128 KiB QD 4): the scene adds "lanes share the bandwidth: 0.17 ms per request
  in a lane" and the bandwidth caption says the lanes share it, so the service time shown (0.12 ms) does not
  contradict the latency (state field `laneMs`, beyond the task's state list).

## Model limits (also in the explanation)

- Sequential HDD with small blocks gives 48,828 IOPS at 4 KiB (no per-request overhead on a streaming disk): the toy
  model's IOPS for sequential access is the bandwidth divided by the block. MB/s stays 200, which is the point.
- No cache, filesystem, write amplification or tail latency (out of scope, other sims).

## Sources

- The task's rules and constants (derived, illustrative) *(check: device constants against vendor data sheets and a
  measurement in NLA T27 when it is written)*.
- J. D. C. Little, "A Proof for the Queuing Formula L = λW", *Operations Research* 9(3), 1961 (rule 4).
- `~/projects/ossimulator/src/modules/disk-scheduling/sim/timing.ts` (SSD 0.1 ms per access) and its `NOTES.md`
  („slijedno/nasumično"): via the task text, not opened.
- `~/projects/napredna-linux-administracija/meta/toc.md` T27: via the task text, not opened (chapters not written).
- `sims/utilisation-latency/index.html` (queue drawing, plot drawing pattern, caption tracking).

## Checks

- Numbers printed by a script from rules 1–6 before coding; every task number reproduced (SPEC.md); asserted in
  `sim.test.js` (23 tests).
- **Mutations** (own): 19 one-at-a-time mutations of `sim.js` (service time, lanes min, cap ≥ vs >, cap ignored,
  Little's law, MB vs KiB, bound order, QD ≥ P vs >, each device constant, changed marks, caption change detection,
  caption keys, waiting count, a preset, `norm`). All 19 failed a test.
- `npm run gate -- iops-latency`: all checks pass; screenshots reviewed (light, dark, grayscale, phone, both
  languages), plus a local Playwright run: every preset by key, QD by the drop-down, a block by click, QD by a click
  on a chart, a device change; no console errors.
- **Fresh review** (a separate agent: re-derived every SPEC number with exact fractions, 50 mutations on a copy, read
  the page and strings, Playwright in both languages). All numbers confirmed. Fixed from it: the scene showed the
  service time with "nobody waits" while a capped device's latency was higher (now `laneMs`, above); Croatian
  agreement with 32 lanes („Radi svih 32 traka" → „Zauzete su sve trake (32)"); the explanation said NVMe at QD 128
  "waits" 0.33 ms (it is the whole latency, at 4 KiB); a visible " = " typed in `index.html` (now in `strings.js`);
  „nitko ne čeka" for requests (now „red je prazan" / „nijedan zahtjev ne čeka"); a dead `spinning` field; the
  missing `littles-law` note. Its 9 real surviving mutations (phantom waiting request, curves ignoring the block or
  rounding q, the ceiling field, QD 256 accepted, defaults, HDD QD 2 caption) now fail tests; 26 mutations in my
  final run, all killed. Its 5 other survivors were equivalent (e.g. `busy >= lanes` for `q >= lanes`).

## Term pairs

In `kit/glossary.js`: *throughput* (propusnost), *latency* (latencija). Not there; written out by hand in the
explanation (`<em lang="en">`). For the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| IOPS | U/I operacija u sekundi (IOPS) | task |
| queue depth | dubina reda | task |
| block size | veličina bloka | task |
| random access / sequential access | nasumični / slijedni pristup | glossary has "sequential / random access" as one entry; the explanation names them separately |

The task's "latency — kašnjenje (latencija)": the glossary has latencija; the page's labels say „kašnjenje" and the
explanation uses `[[latency]]` (*latency* (latencija)).

## Shared requests

- **Kit `choice`** with more than 5 options (or a `range` over a list of values, e.g. `values: [1, 2, 4, …, 128]`),
  so a log-spaced parameter like QD can be a slider. The page uses `select` meanwhile.
- **Model promotion**: `metrics(dev, bsKiB, q)` is pure over plain data and takes a real-valued q; it can move to
  `models/` unchanged if another sim (e.g. `tail-latency`) needs the closed-loop device model.

## Time

Started 05:19, done 05:35 (about 16 minutes, one session, including the fresh review and its fixes).
