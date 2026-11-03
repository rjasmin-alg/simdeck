<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-live-migration: notes

New explorer (task `docs/tasks/w3/lnx-live-migration.md`, catalogue `lnx-live-migration`, §4.4, NLA T02). Rules and
expected numbers: `SPEC.md`. The page grid is the kit's K3 block grid (`kit/blockgrid.js`); the round chart and the
result card are the page's own HTML.

## Decisions

- **Pure, promotable model.** `migrate(params)` returns the whole migration from plain numbers; `throttleAt`, `fits`
  and `pickCells` hold no strings. `initial(params)` adds the view the round slider picks and the page grid.
- **Rounds are counted including round 0**, as the task's presets do ("2 rounds" = rounds 0 and 1; `maxRounds` 30 =
  rounds 0–29, then forced).
- **Rule 3 before rule 5.** After the last allowed round the stop test runs first: a remainder that fits is
  `converged`, not `forced` (tested with R = 2).
- **The ≤ test** is `remaining · 1000 ≤ limit_ms · B` so that whole numbers compare exactly (tie-break test: W = 300
  MiB, B = 1000 MiB/s, limit 300 ms stops; 301 MiB does not).
- **Auto-converge** is capped at 99 % (QEMU `max-cpu-throttle` default) so that the dirty rate never reaches 0 by
  throttling alone; it starts at round 2 as the task says (QEMU starts from its own dirty-ratio heuristic: SPEC.md).
- **The round slider** has the bound `0…number of rounds`: positions 0…n − 1 show the start of that round (what it is
  about to send), position n is the pause. The kit clamps the stored value to the bound, so presets set `round` to the
  view that shows their point: `10gbe-converges` round 1, `1gbe-busy` the pause, `dirty-faster` round 1,
  `auto-converge` round 5, `1gbe-quiet` round 2. The default is 1 (the first resend).
- **The page grid**: 4 × 32 cells of M / 128 each (32 MiB at 4 GiB). The working set is the first ⌈W / cell⌉ cells,
  under a K3 bracket; dirty cells are a fixed shuffle of them (seeded by the view), rounded up so a few MiB still show
  one cell. Kinds: not copied `ghost` (dashed), copied and clean `fill` c3, dirtied `soft` c2 (hatched), copied in the
  pause `fill` c8 with ‖. Every state has a pattern or a mark besides its colour (grayscale screenshot checked).
- **The chart's scale** is the largest round after round 0, the pause and the limit, × 1.12, so round 0 (often 4× the
  rest) is cut off: a break band near its top and its value printed above. Without that, every later round would be a
  sliver. The downtime limit is drawn as a dashed line at limit × B MiB, and its value is in the chart heading
  ("granica: 33 MiB = 300 ms × 110 MiB/s"), not on the line, where it collided with the pause bar.
- **"Changed"** marks the result-card values (outcome, rounds, total, downtime, ratio, throttle) that changed with the
  last param change; moving the round slider changes no result and marks nothing.
- **Review** (fresh reviewer, this session): fixed the caption of a forced migration that throttling did not save
  (it said "the rounds shrink, but too slowly"; every round still resent W, now `cForcedWss` plus the throttle note),
  `cThrottled` no longer assumes D ≥ B, the round slider no longer clears the changed marks after a preset, the
  explanation no longer says the downtime is never zero (it is 0 when the guest dirties nothing).
- **Captions** explain the outcome, one key per case (SPEC.md "Captions"); the task caption is `cForcedWss` word for
  word with the numbers filled in. The round-by-round detail is on the stage under the grid.
- **Ratio row**: D/B is the unthrottled ratio; when throttling made a D ≥ B migration converge, its note says
  "unthrottled, they would not shrink".
- **Concepts, not tools**: the page names no hypervisor or command. QEMU parameter names and `virsh` options are in
  SPEC.md and here, for the builder. "Auto-converge" stays in italics as the English term in the explanation; the
  toggle and preset say "Prigušivanje gosta" / "Throttle the guest".
- **Panel fit at 1920×1080**: five presets in two columns with short labels (the details are in the hints and the
  explanation), tighter sliders, no slider hints (the bandwidth hint "1 GbE ≈ 110, 10 GbE ≈ 1000 MiB/s" moved to the
  explanation). The legend labels are short so the header tools stay on the title row in Croatian.
- **Units** (MiB, GiB, MiB/s, ms, s, VM) are keys in `strings.js`, so the gate's word check knows them.
- **Tags**: topic `linux-admin`, tag `virtualization`, level `advanced` (as the task says; all in `tags.json`). No
  `related`: no other virtualization sim exists yet (`lnx-hypervisor-types` is not built). Entries: `dirty-faster`
  and `auto-converge` (the misconception "a faster link always finishes" and its remedy).

## Deviations from the task

- **Legend "grey cell = not yet copied"** is a dashed empty cell (K3 `ghost`), not a grey fill: grey fill would read
  like the dark pause cells in grayscale.
- **Slider steps**: `dirtyMiBs` and `bwMiBs` step 10, `wssMiB` step 64, `downtimeMs` step 10; every preset value is on
  the grid.
- **Round durations in the chart**: the task asks for "data sent per round and its duration". The bars show the data
  sent; the duration is printed on the selected round's bar (and the pause's) and in the round line under the grid,
  not on every bar: 30 labels do not fit and the slider picks the round to read.
- **The model's `maxRounds` accepts values below 5** (the slider does not): the rule-3-before-rule-5 tie-break test
  uses R = 2.
- **The hr concept** reads „Pretkopiranje konvergira samo ako gost prlja sporije nego što veza kopira" (the subject is
  pre-copy, not its rounds, to keep the header on one line).

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, T02 "Seoba uživo i zajedničko spremište"
  (chapters not written yet).
- QEMU documentation "Migration framework" (pre-copy, stop-and-copy) *(check)*; QMP `migrate-set-parameters`:
  `downtime-limit` default 300 ms, `cpu-throttle-initial` 20, `cpu-throttle-increment` 10, `max-cpu-throttle` 99,
  `max-bandwidth` *(check: from memory, not opened in this session)*.
- libvirt `virsh` manual: `migrate --live --timeout` (with the suspend action), `migrate-setmaxdowntime` *(check)*.
- C. Clark et al., "Live Migration of Virtual Machines", NSDI 2005: iterative pre-copy, writable working set *(check)*.
- The five preset numbers are derived and were checked with `sim.js` against the task's figures (all match: SPEC.md).

## Unchecked *(check)*

- Every QEMU/libvirt default above (not read from the documents in this session; no network).
- Rule 6's proportional dirtying under throttle is a simplification (stated on the page's explanation only as "gets
  less CPU"; SPEC.md says so).
- Croatian terms marked *(check)* in the task: pretkopiranje, prljava stranica, vrijeme prekida.

## Term pairs (missing from `kit/glossary.js`; written out in both tables until added)

| en | hr | source |
|---|---|---|
| live migration | seoba uživo | NLA toc T02 |
| pre-copy | pretkopiranje | task *(check)* |
| dirty page | prljava stranica | task *(check)* |
| downtime | vrijeme prekida | task *(check)* |
| stop-and-copy | zaustavi i kopiraj | this sim |
| shared storage | zajedničko spremište | NLA toc T02 |
| bandwidth | propusnost | task |
| auto-converge | prigušivanje gosta | this sim (descriptive) |

Used from the glossary: `virtual machine`, `guest`. `working set` is in the glossary too but is written out (the
Croatian sentence needs the genitive).

## Shared requests

- None needed. K3 did everything the grid needs; the bracket bands of rows without a bracket are removed after
  `Simdeck.blockGrid.split()` (it gives every piece an empty `brackets` list, which keeps a 1.5 rem band on each row).
  A `split()` option to leave empty lists out would save that line; not requested as a change.

## Time

Start 17:33, done 17:50 (2026-11-03).
